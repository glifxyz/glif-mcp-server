import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../api.js";
import type { SavedGlif } from "../saved-glifs.js";
import * as savedGlifsModule from "../saved-glifs.js";
import * as contentBlocks from "../utils/content-blocks.js";
import * as utils from "../utils/utils.js";
import { setupToolHandlers } from "./index.js";

vi.mock("../api.js");
vi.mock("../saved-glifs.js");
vi.mock("../utils/utils.js");
vi.mock("../utils/content-blocks.js");

const createSavedGlif = (id: string, num: number): SavedGlif => ({
  id,
  toolName: `test_tool_${num}`,
  name: `Test Tool ${num}`,
  description: `Test tool ${num} description`,
  createdAt: new Date().toISOString(),
});

const sampleGlifDetails = {
  glif: {
    id: "glif-789",
    name: "Original Glif Name",
    description: "Original glif description",
    imageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    output: null,
    outputType: null,
    forkedFromId: null,
    featuredAt: null,
    userId: "user-123",
    completedSpellRunCount: 10,
    averageDuration: 500,
    likeCount: 5,
    commentCount: 0,
    user: {
      id: "user-123",
      name: "Test User",
      username: "testuser",
      image: null,
      bio: "Test bio",
      website: "https://example.com",
      location: "Test location",
      banned: false,
      staff: false,
      isSubscriber: true,
    },
    spellTags: [],
    spheres: [],
    data: {
      nodes: [
        {
          name: "input1",
          type: "text-input",
          params: { label: "Input 1" },
        },
      ],
    },
  },
  recentRuns: [],
};

const sampleRunResult = {
  id: "run-123",
  inputs: { input1: "test input" },
  output: "Test output",
  outputFull: { type: "TEXT", value: "Test output" },
};

describe("Tools with Saved Glifs", () => {
  let server: Server;
  let listToolsHandler: (request: any) => Promise<any>;
  let callToolHandler: (request: any) => Promise<any>;
  let sampleGlif1: SavedGlif;
  let sampleGlif2: SavedGlif;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.IGNORE_DISCOVERY_TOOLS = "true";
    process.env.BOT_TOOLS = "true"; // Enable bot tools for tests
    sampleGlif1 = createSavedGlif("glif-123", 1);
    sampleGlif2 = createSavedGlif("glif-456", 2);

    server = new Server(
      { name: "test-server", version: "0.1.0" },
      { capabilities: { tools: {}, resources: {}, prompts: {} } }
    );

    server.setRequestHandler = vi.fn((schema, handler) => {
      if (schema === ListToolsRequestSchema) listToolsHandler = handler;
      if (schema === CallToolRequestSchema) callToolHandler = handler;
    });

    setupToolHandlers(server);
  });

  afterEach(() => {
    delete process.env.IGNORE_DISCOVERY_TOOLS;
    delete process.env.BOT_TOOLS;
    vi.clearAllMocks();
  });

  describe("ListToolsRequestSchema handler", () => {
    it("should include saved glifs in tool definitions", async () => {
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([
        sampleGlif1,
        sampleGlif2,
      ]);

      const result = await listToolsHandler({});
      const expectedToolCount = 12; // 3 core + 7 metaskill + 2 saved glifs
      expect(result.tools).toHaveLength(expectedToolCount);

      const savedGlifTools = result.tools.filter(
        (tool: any) =>
          tool.name === sampleGlif1.toolName ||
          tool.name === sampleGlif2.toolName
      );

      expect(savedGlifTools).toHaveLength(2);
      const tool = savedGlifTools[0];
      expect(tool.name).toBe(sampleGlif1.toolName);
      expect(tool.description).toContain(sampleGlif1.name);
      expect(tool.description).toContain(sampleGlif1.description);
      expect(tool.inputSchema.properties.inputs).toBeDefined();
      expect(tool.inputSchema.required).toContain("inputs");
    });

    it("should handle empty saved glifs", async () => {
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([]);

      const result = await listToolsHandler({});
      const expectedToolCount = 10; // 3 core + 7 metaskill tools
      expect(result.tools).toHaveLength(expectedToolCount);
    });
  });

  describe("CallToolRequestSchema handler", () => {
    it("should save glif as tool with default and custom properties", async () => {
      vi.mocked(api.getGlifDetails).mockResolvedValue(sampleGlifDetails);

      const defaultResult = await callToolHandler({
        params: {
          name: "save_glif_as_tool",
          arguments: {
            id: "glif-789",
            toolName: "my_custom_tool",
          },
        },
      });

      expect(savedGlifsModule.saveGlif).toHaveBeenCalledWith({
        id: "glif-789",
        toolName: "my_custom_tool",
        name: sampleGlifDetails.glif.name,
        description: sampleGlifDetails.glif.description,
        createdAt: expect.any(String),
      });
      expect(defaultResult.content[0].text).toContain(
        "Successfully saved glif"
      );

      const customResult = await callToolHandler({
        params: {
          name: "save_glif_as_tool",
          arguments: {
            id: "glif-789",
            toolName: "my_custom_tool",
            name: "Custom Name",
            description: "Custom description",
          },
        },
      });

      expect(savedGlifsModule.saveGlif).toHaveBeenCalledWith({
        id: "glif-789",
        toolName: "my_custom_tool",
        name: "Custom Name",
        description: "Custom description",
        createdAt: expect.any(String),
      });
      expect(customResult.content[0].text).toContain("Successfully saved glif");
    });

    it("should handle remove_glif_tool operations", async () => {
      vi.mocked(savedGlifsModule.removeGlif).mockResolvedValueOnce(true);
      const existingResult = await callToolHandler({
        params: {
          name: "remove_glif_tool",
          arguments: { toolName: "test_tool_1" },
        },
      });

      expect(savedGlifsModule.removeGlif).toHaveBeenCalledWith("test_tool_1");
      expect(existingResult.content[0].text).toContain(
        "Successfully removed tool"
      );

      vi.mocked(savedGlifsModule.removeGlif).mockResolvedValueOnce(false);
      const missingResult = await callToolHandler({
        params: {
          name: "remove_glif_tool",
          arguments: { toolName: "non_existent_tool" },
        },
      });

      expect(missingResult.content[0].text).toContain("not found");
    });

    it("should handle listing saved glif tools", async () => {
      // Test populated list
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([
        sampleGlif1,
        sampleGlif2,
      ]);

      const formattedGlifs = [sampleGlif1, sampleGlif2]
        .map(
          (glif) =>
            `${glif.name} (tool: ${glif.toolName})\n${
              glif.description
            }\nOriginal Glif ID: ${glif.id}\nSaved: ${new Date(
              glif.createdAt
            ).toLocaleString()}\n`
        )
        .join("\n");

      const populatedResult = {
        content: [
          {
            type: "text",
            text: `Saved glif tools:\n\n${formattedGlifs}`,
          },
        ],
      };

      const handler = vi.fn().mockResolvedValueOnce(populatedResult);
      server.setRequestHandler(CallToolRequestSchema, handler);

      const result = await handler({
        params: {
          name: "list_saved_glif_tools",
          arguments: {},
        },
      });

      expect(result.content[0].text).toMatch(/^Saved glif tools:/);
      expect(result.content[0].text).toContain(sampleGlif1.name);
      expect(result.content[0].text).toContain(sampleGlif2.name);

      // Test empty list
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([]);
      const emptyResult = {
        content: [
          {
            type: "text",
            text: "No saved glif tools found.",
          },
        ],
      };

      handler.mockResolvedValueOnce(emptyResult);
      const empty = await handler({
        params: {
          name: "list_saved_glif_tools",
          arguments: {},
        },
      });

      expect(empty.content[0].text).toBe("No saved glif tools found.");
    });

    it("should execute saved glif tools", async () => {
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([
        sampleGlif1,
        sampleGlif2,
      ]);
      vi.mocked(api.runGlif).mockResolvedValueOnce(sampleRunResult);
      vi.mocked(contentBlocks.createContentBlocks).mockResolvedValueOnce([
        { type: "text", text: sampleRunResult.output },
      ]);

      const result = await callToolHandler({
        params: {
          name: sampleGlif1.toolName,
          arguments: { inputs: ["test input"] },
        },
      });

      expect(api.runGlif).toHaveBeenCalledWith(sampleGlif1.id, ["test input"]);
      expect(contentBlocks.createContentBlocks).toHaveBeenCalledWith(
        sampleRunResult.output,
        sampleRunResult.outputFull
      );
      expect(result.content[0].text).toBe(sampleRunResult.output);
    });
  });
});
