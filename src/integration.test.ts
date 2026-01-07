import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupToolHandlers } from "./tools/index.js";

vi.mock("./api.js");

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

  it("should list all available tools", async () => {
    const result = await listToolsHandler({});
    expect(result.tools.length).toBeGreaterThan(0);

    const toolNames = result.tools.map((t: any) => t.name);
    expect(toolNames).toContain("run_workflow");
    expect(toolNames).toContain("workflow_info");
  });

  describe("Error handling", () => {
    it("should handle unknown tool calls", async () => {
      await expect(
        callToolHandler({
          params: {
            name: "non_existent_tool",
            arguments: {},
          },
        })
      ).rejects.toThrow("Unknown tool");
    });
  });
});
