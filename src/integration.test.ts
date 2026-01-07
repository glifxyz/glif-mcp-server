import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "./api.js";
import type { SavedGlif } from "./saved-glifs.js";
import * as savedGlifsModule from "./saved-glifs.js";
import { setupToolHandlers } from "./tools/index.js";

vi.mock("./api.js");
vi.mock("fs/promises");

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

describe("Integration Tests", () => {
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

  it("should execute saved workflow tools via agent skill loading", async () => {
    const savedGlif = createSavedGlif("glif-789", 1);
    savedGlif.toolName = "agent_skill_tool";
    savedGlif.name = "Agent Skill";
    savedGlif.description = "A skill loaded from an agent";

    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([savedGlif]));
    vi.spyOn(savedGlifsModule, "getSavedGlifs").mockResolvedValue([savedGlif]);

    const toolsResult = await listToolsHandler({});
    const savedTool = toolsResult.tools.find(
      (tool: any) => tool.name === savedGlif.toolName
    );
    expect(savedTool).toBeDefined();
    expect(savedTool.description).toContain(savedGlif.name);

    vi.mocked(api.runGlif).mockResolvedValue(sampleRunResult);
    const useResult = await callToolHandler({
      params: {
        name: savedGlif.toolName,
        arguments: { inputs: ["test input"] },
      },
    });

    expect(api.runGlif).toHaveBeenCalledWith(savedGlif.id, ["test input"]);
    expect(useResult.content[0].text).toBe(sampleRunResult.output);
  });

  describe("Error handling", () => {
    it("should handle unknown tool calls", async () => {
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
