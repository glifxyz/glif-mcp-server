import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as api from "../src/api";
import * as savedGlifsModule from "../src/saved-glifs";
import { setupToolHandlers } from "../src/tools/index.js";
import { SavedGlif } from "../src/saved-glifs";
import * as utils from "../src/utils/utils.js";

vi.mock("../src/api");
vi.mock("fs/promises");

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

describe("Integration Tests for Saved Glifs", () => {
  let server: Server;
  let listToolsHandler: (request: any) => Promise<any>;
  let callToolHandler: (request: any) => Promise<any>;

  beforeEach(() => {
    vi.resetAllMocks();
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

  afterEach(() => vi.clearAllMocks());

  it("should handle the complete glif tool lifecycle", async () => {
    const savedGlif = createSavedGlif("glif-789", 1);
    savedGlif.toolName = "test_glif_tool";
    savedGlif.name = "Test Glif Tool";
    savedGlif.description = "A test glif tool";

    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("File not found"));
    vi.mocked(api.getGlifDetails).mockResolvedValue(sampleGlifDetails);
    vi.spyOn(savedGlifsModule, "saveGlif").mockResolvedValueOnce();

    const saveResult = await callToolHandler({
      params: {
        name: "save_glif_as_tool",
        arguments: {
          id: savedGlif.id,
          toolName: savedGlif.toolName,
          name: savedGlif.name,
          description: savedGlif.description,
        },
      },
    });

    expect(saveResult.content[0].text).toContain("Successfully saved glif");
    expect(savedGlifsModule.saveGlif).toHaveBeenCalledWith({
      ...savedGlif,
      createdAt: expect.any(String),
    });

    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([savedGlif]));
    vi.spyOn(savedGlifsModule, "getSavedGlifs").mockResolvedValue([savedGlif]);

    const toolsResult = await listToolsHandler({});
    const savedGlifTool = toolsResult.tools.find(
      (tool: any) => tool.name === savedGlif.toolName
    );
    expect(savedGlifTool).toBeDefined();
    expect(savedGlifTool.description).toContain(savedGlif.name);

    vi.mocked(api.runGlif).mockResolvedValue(sampleRunResult);
    const useResult = await callToolHandler({
      params: {
        name: savedGlif.toolName,
        arguments: { inputs: ["test input"] },
      },
    });

    expect(api.runGlif).toHaveBeenCalledWith(savedGlif.id, ["test input"]);
    expect(useResult.content[0].text).toBe(sampleRunResult.output);

    vi.spyOn(savedGlifsModule, "removeGlif").mockResolvedValue(true);
    const removeResult = await callToolHandler({
      params: {
        name: "remove_glif_tool",
        arguments: { toolName: savedGlif.toolName },
      },
    });

    expect(removeResult.content[0].text).toContain("Successfully removed tool");
    expect(savedGlifsModule.removeGlif).toHaveBeenCalledWith(
      savedGlif.toolName
    );
  });

  describe("Error handling", () => {
    it("should handle non-existent glif operations", async () => {
      vi.mocked(api.getGlifDetails).mockRejectedValue(
        new Error("Glif not found")
      );
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      await expect(
        callToolHandler({
          params: {
            name: "save_glif_as_tool",
            arguments: {
              id: "non-existent-glif",
              toolName: "test_glif_tool",
            },
          },
        })
      ).rejects.toThrow("Glif not found");

      vi.mocked(fs.readFile).mockResolvedValue("[]");
      await expect(
        callToolHandler({
          params: {
            name: "non_existent_tool",
            arguments: { inputs: ["test input"] },
          },
        })
      ).rejects.toThrow("Unknown tool");
    });
  });
});
