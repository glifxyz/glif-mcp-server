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
          resources: {},
          prompts: {},
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
          name: "list_featured_glifs",
          description: "Get a curated list of featured glifs",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "search_glifs",
          description: "Search for glifs by query string",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query string",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "glif_info",
          description:
            "Get detailed information about a glif including input fields",
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
        case "list_featured_glifs": {
          return {
            content: [
              {
                type: "text",
                text: "Test featured glifs response",
              },
            ],
          };
        }
        case "search_glifs": {
          const args = request.params.arguments as { query?: string };
          if (!args?.query) {
            throw new McpError(
              ErrorCode.InvalidParams,
              "Missing required field: query"
            );
          }
          return {
            content: [
              {
                type: "text",
                text: "Test search results",
              },
            ],
          };
        }
        case "glif_info": {
          const args = request.params.arguments as { id?: string };
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
                text: "Test glif info response",
              },
            ],
          };
        }
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
    const response = await transport.request("listTools");
    expect(response.tools).toHaveLength(4);
    expect(response.tools[0].name).toBe("run_glif");
    expect(response.tools[1].name).toBe("list_featured_glifs");
    expect(response.tools[2].name).toBe("search_glifs");
    expect(response.tools[3].name).toBe("glif_info");
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

  it("should validate glif_info tool input schema", async () => {
    const validParams = {
      name: "glif_info",
      arguments: {
        id: "test-id",
      },
    };

    const invalidParams = {
      name: "get_glif_info",
      arguments: {},
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
        query: "test query",
      },
    };

    const invalidParams = {
      name: "search_glifs",
      arguments: {
        // Missing required 'query' field
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

  it("should handle list_featured_glifs tool", async () => {
    const params = {
      name: "list_featured_glifs",
      arguments: {},
    };

    // Should not throw since list_featured_glifs takes no arguments
    await expect(transport.request("callTool", params)).resolves.toBeDefined();
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
