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

const sampleRunResult = {
  id: "run-123",
  inputs: { input1: "test input" },
  output: "Test output",
  outputFull: { type: "TEXT", value: "Test output" },
};

describe("Tool Registration", () => {
  let server: Server;
  let listToolsHandler: (request: any) => Promise<any>;
  let callToolHandler: (request: any) => Promise<any>;
  let sampleGlif1: SavedGlif;
  let sampleGlif2: SavedGlif;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.IGNORE_DISCOVERY_TOOLS = "true";
    process.env.AGENT_TOOLS = "true";
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
    delete process.env.AGENT_TOOLS;
    vi.clearAllMocks();
  });

  describe("ListToolsRequestSchema handler", () => {
    it("should include saved workflows in tool definitions", async () => {
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([
        sampleGlif1,
        sampleGlif2,
      ]);

      const result = await listToolsHandler({});
      // 2 core + 3 agent + 2 saved = 7
      expect(result.tools).toHaveLength(7);

      const savedTools = result.tools.filter(
        (tool: any) =>
          tool.name === sampleGlif1.toolName ||
          tool.name === sampleGlif2.toolName
      );

      expect(savedTools).toHaveLength(2);
      const tool = savedTools[0];
      expect(tool.name).toBe(sampleGlif1.toolName);
      expect(tool.description).toContain(sampleGlif1.name);
      expect(tool.inputSchema.properties.inputs).toBeDefined();
    });

    it("should handle empty saved workflows", async () => {
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([]);

      const result = await listToolsHandler({});
      // 2 core + 3 agent = 5
      expect(result.tools).toHaveLength(5);
    });
  });

  describe("CallToolRequestSchema handler", () => {
    it("should execute saved workflow tools", async () => {
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
      expect(result.content[0].text).toBe(sampleRunResult.output);
    });

    it("should throw for unknown tools", async () => {
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([]);

      await expect(
        callToolHandler({
          params: {
            name: "unknown_tool",
            arguments: {},
          },
        })
      ).rejects.toThrow("Unknown tool");
    });
  });
});
