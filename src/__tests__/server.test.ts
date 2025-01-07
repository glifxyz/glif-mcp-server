import { describe, it, expect, beforeEach } from "vitest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";

// Mock environment variable
process.env.GLIF_API_TOKEN = "test-token";

class TestTransport extends StdioServerTransport {
  private currentRequest?: {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  };

  protected async write(message: string): Promise<void> {
    const response = JSON.parse(message);
    if (this.currentRequest) {
      if (response.error) {
        this.currentRequest.reject(new Error(response.error.message));
      } else {
        this.currentRequest.resolve(response.result);
      }
      this.currentRequest = undefined;
    }
  }

  async request(method: string, params: any = {}): Promise<any> {
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    };

    const promise = new Promise((resolve, reject) => {
      this.currentRequest = { resolve, reject };
    });

    await this._ondata(Buffer.from(JSON.stringify(request)));
    return promise;
  }
}

describe("Glif MCP Server", () => {
  let server: Server;
  let transport: TestTransport;

  beforeEach(async () => {
    server = new Server(
      {
        name: "glif-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Set up request handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "run_glif",
          description: "Run a glif with the specified ID and inputs",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The ID of the glif to run",
              },
              inputs: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Array of input values for the glif",
              },
            },
            required: ["id", "inputs"],
          },
        },
        {
          name: "search_glifs",
          description: "Search for glifs or get details about specific glifs",
          inputSchema: {
            type: "object",
            properties: {
              q: {
                type: "string",
                description: "Search query (optional)",
              },
              featured: {
                type: "boolean",
                description: "Only return featured glifs (optional)",
              },
              id: {
                type: "string",
                description: "Get details for a specific glif ID (optional)",
              },
            },
          },
        },
        {
          name: "show_glif",
          description:
            "Show detailed information about a glif and its recent runs",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The ID of the glif to show details for",
              },
            },
            required: ["id"],
          },
        },
      ],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "run_glif": {
          const args = request.params.arguments as {
            id?: string;
            inputs?: string[];
          };
          if (!args?.id) {
            throw new McpError(
              ErrorCode.InvalidParams,
              "Missing required field: id"
            );
          }
          return {
            content: [
              {
                type: "text",
                text: "Test response",
              },
            ],
          };
        }
        case "search_glifs":
        case "show_glif":
          return {
            content: [
              {
                type: "text",
                text: "Test response",
              },
            ],
          };
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });

    transport = new TestTransport();
    await server.connect(transport);
  });

  it("should list available tools", async () => {
    console.log("starting...")
    const response = await transport.request("listTools");
    console.log("ok got it...")
    expect(response.tools).toHaveLength(3);
    expect(response.tools[0].name).toBe("run_glif");
    expect(response.tools[1].name).toBe("search_glifs");
    expect(response.tools[2].name).toBe("show_glif");
  });

  it("should validate run_glif tool input schema", async () => {
    const validParams = {
      name: "run_glif",
      arguments: {
        id: "test-id",
        inputs: ["input1", "input2"],
      },
    };

    const invalidParams = {
      name: "run_glif",
      arguments: {
        // Missing required 'id' field
        inputs: ["input1", "input2"],
      },
    };

    // Valid request should not throw
    await expect(
      transport.request("callTool", validParams)
    ).resolves.toBeDefined();

    // Invalid request should throw
    await expect(
      transport.request("callTool", invalidParams)
    ).rejects.toThrow();
  });

  it("should validate search_glifs tool input schema", async () => {
    const validParams = {
      name: "search_glifs",
      arguments: {
        q: "test query",
        featured: true,
      },
    };

    // All fields are optional, so this is also valid
    const minimalParams = {
      name: "search_glifs",
      arguments: {},
    };

    await expect(
      transport.request("callTool", validParams)
    ).resolves.toBeDefined();
    await expect(
      transport.request("callTool", minimalParams)
    ).resolves.toBeDefined();
  });

  it("should reject unknown tool requests", async () => {
    const invalidParams = {
      name: "unknown_tool",
      arguments: {},
    };

    await expect(
      transport.request("callTool", invalidParams)
    ).rejects.toThrow();
  });
});
