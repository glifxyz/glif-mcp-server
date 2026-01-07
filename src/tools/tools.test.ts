import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupToolHandlers } from "./index.js";

vi.mock("../api.js");
vi.mock("../utils/utils.js");

describe("Tool Registration", () => {
  let server: Server;
  let listToolsHandler: (request: any) => Promise<any>;
  let callToolHandler: (request: any) => Promise<any>;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.IGNORE_DISCOVERY_TOOLS = "true";

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
    vi.clearAllMocks();
  });

  describe("ListToolsRequestSchema handler", () => {
    it("should list core tools", async () => {
      const result = await listToolsHandler({});
      // 2 core tools (run_workflow, workflow_info)
      expect(result.tools).toHaveLength(2);

      const toolNames = result.tools.map((t: any) => t.name);
      expect(toolNames).toContain("run_workflow");
      expect(toolNames).toContain("workflow_info");
    });

    it("should include discovery tools when enabled", async () => {
      delete process.env.IGNORE_DISCOVERY_TOOLS;

      const result = await listToolsHandler({});
      // 2 core + 4 discovery = 6
      expect(result.tools).toHaveLength(6);
    });
  });

  describe("CallToolRequestSchema handler", () => {
    it("should throw for unknown tools", async () => {
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
