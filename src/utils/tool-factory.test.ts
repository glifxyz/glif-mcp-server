import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { ToolRequest } from "./request-parsing.js";
import {
  createErrorResponse,
  createListResponse,
  createTextResponse,
  createTool,
  type ToolConfig,
} from "./tool-factory.js";

// Mock dependencies
vi.mock("./request-parsing.js", () => ({
  parseToolArguments: vi.fn((request, _schema) => {
    // Simple mock that just returns the arguments
    return request.params.arguments;
  }),
}));

vi.mock("./utils.js", () => ({
  handleApiError: vi.fn((error, context) => {
    throw new Error(`Handled error in ${context}: ${error.message}`);
  }),
}));

describe("Tool Factory", () => {
  describe("createTool", () => {
    it("should create a tool with correct definition structure", () => {
      const config: ToolConfig = {
        name: "test_tool",
        description: "A test tool",
        schema: z.object({ input: z.string() }),
        properties: {
          input: {
            type: "string",
            description: "Test input",
          },
        },
        required: ["input"],
      };

      const handler = vi
        .fn()
        .mockResolvedValue(createTextResponse("test response"));

      const tool = createTool(config, handler);

      expect(tool.definition).toEqual({
        name: "test_tool",
        description: "A test tool",
        inputSchema: {
          type: "object",
          properties: {
            input: {
              type: "string",
              description: "Test input",
            },
          },
          required: ["input"],
        },
      });

      expect(tool.schema).toBe(config.schema);
      expect(typeof tool.handler).toBe("function");
    });

    it("should create a tool with default empty required array", () => {
      const config: ToolConfig = {
        name: "test_tool",
        description: "A test tool",
        schema: z.object({}),
        properties: {},
        // No required field specified
      };

      const handler = vi.fn().mockResolvedValue(createTextResponse("test"));

      const tool = createTool(config, handler);

      expect(tool.definition.inputSchema.required).toEqual([]);
    });

    it("should create a working handler that calls the provided function", async () => {
      const mockHandler = vi
        .fn()
        .mockResolvedValue(createTextResponse("handler called"));
      const config: ToolConfig = {
        name: "test_tool",
        description: "Test",
        schema: z.object({ input: z.string() }),
        properties: { input: { type: "string" } },
      };

      const tool = createTool(config, mockHandler);

      const mockRequest: ToolRequest = {
        params: {
          name: "test_tool",
          arguments: { input: "test value" },
        },
      } as any;

      const result = await tool.handler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith({ input: "test value" });
      expect(result).toEqual(createTextResponse("handler called"));
    });

    it("should handle errors through handleApiError", async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error("Handler error"));
      const config: ToolConfig = {
        name: "error_tool",
        description: "Error test",
        schema: z.object({}),
        properties: {},
      };

      const tool = createTool(config, mockHandler);

      const mockRequest: ToolRequest = {
        params: { name: "error_tool", arguments: {} },
      } as any;

      await expect(tool.handler(mockRequest)).rejects.toThrow(
        "Handled error in error_tool: Handler error"
      );
    });
  });

  describe("createTextResponse", () => {
    it("should create a valid text response", () => {
      const response = createTextResponse("Hello, world!");

      expect(response).toEqual({
        content: [
          {
            type: "text",
            text: "Hello, world!",
          },
        ],
      });
    });

    it("should handle empty text", () => {
      const response = createTextResponse("");

      expect(response).toEqual({
        content: [
          {
            type: "text",
            text: "",
          },
        ],
      });
    });

    it("should handle multiline text", () => {
      const multilineText = "Line 1\nLine 2\nLine 3";
      const response = createTextResponse(multilineText);

      expect(response).toEqual({
        content: [
          {
            type: "text",
            text: multilineText,
          },
        ],
      });
    });
  });

  describe("createListResponse", () => {
    it("should create a list response without title", () => {
      const items = ["Item 1", "Item 2", "Item 3"];
      const response = createListResponse(items);

      expect(response).toEqual({
        content: [
          {
            type: "text",
            text: "Item 1\nItem 2\nItem 3",
          },
        ],
      });
    });

    it("should create a list response with title", () => {
      const items = ["Apple", "Banana", "Cherry"];
      const response = createListResponse(items, "Fruits");

      expect(response).toEqual({
        content: [
          {
            type: "text",
            text: "Fruits\n\nApple\nBanana\nCherry",
          },
        ],
      });
    });

    it("should handle empty list", () => {
      const response = createListResponse([]);

      expect(response).toEqual({
        content: [
          {
            type: "text",
            text: "",
          },
        ],
      });
    });

    it("should handle empty list with title", () => {
      const response = createListResponse([], "Empty List");

      expect(response).toEqual({
        content: [
          {
            type: "text",
            text: "Empty List\n\n",
          },
        ],
      });
    });

    it("should handle single item list", () => {
      const response = createListResponse(["Single item"], "Solo");

      expect(response).toEqual({
        content: [
          {
            type: "text",
            text: "Solo\n\nSingle item",
          },
        ],
      });
    });
  });

  describe("createErrorResponse", () => {
    it("should create error response from Error object", () => {
      const error = new Error("Something went wrong");
      const response = createErrorResponse(error, "test_context");

      expect(response).toEqual({
        content: [
          {
            type: "text",
            text: "Error in test_context: Something went wrong",
          },
        ],
      });
    });

    it("should create error response from string", () => {
      const response = createErrorResponse("String error", "validation");

      expect(response).toEqual({
        content: [
          {
            type: "text",
            text: "Error in validation: String error",
          },
        ],
      });
    });

    it("should create error response from non-Error object", () => {
      const errorObj = { message: "Object error", code: 500 };
      const response = createErrorResponse(errorObj, "api_call");

      expect(response).toEqual({
        content: [
          {
            type: "text",
            text: "Error in api_call: [object Object]",
          },
        ],
      });
    });

    it("should handle null/undefined errors", () => {
      const response1 = createErrorResponse(null, "null_test");
      const response2 = createErrorResponse(undefined, "undefined_test");

      expect(response1).toEqual({
        content: [{ type: "text", text: "Error in null_test: null" }],
      });

      expect(response2).toEqual({
        content: [{ type: "text", text: "Error in undefined_test: undefined" }],
      });
    });
  });

  describe("Integration tests", () => {
    it("should work with real-world tool configuration", () => {
      const searchSchema = z.object({
        query: z.string(),
        limit: z.number().optional(),
      });

      const searchConfig: ToolConfig = {
        name: "search_tool",
        description: "Search for items",
        schema: searchSchema,
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
          limit: {
            type: "number",
            description: "Maximum results",
          },
        },
        required: ["query"],
      };

      const searchHandler = vi.fn().mockImplementation(async (args) => {
        const results = [`Result for: ${args.query}`];
        if (args.limit) {
          results.push(`Limited to: ${args.limit}`);
        }
        return createListResponse(results, "Search Results");
      });

      const tool = createTool(searchConfig, searchHandler);

      expect(tool.definition.name).toBe("search_tool");
      expect(tool.definition.inputSchema.required).toEqual(["query"]);
      expect(typeof tool.handler).toBe("function");
    });

    it("should handle complex nested schemas", () => {
      const complexSchema = z.object({
        user: z.object({
          name: z.string(),
          age: z.number(),
        }),
        preferences: z.array(z.string()),
        metadata: z.record(z.string(), z.unknown()).optional(),
      });

      const config: ToolConfig = {
        name: "complex_tool",
        description: "Handle complex data",
        schema: complexSchema,
        properties: {
          user: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" },
            },
          },
          preferences: {
            type: "array",
            items: { type: "string" },
          },
          metadata: {
            type: "object",
          },
        },
        required: ["user", "preferences"],
      };

      const handler = vi
        .fn()
        .mockResolvedValue(createTextResponse("Complex handled"));

      const tool = createTool(config, handler);

      expect(tool.definition.inputSchema.required).toEqual([
        "user",
        "preferences",
      ]);
      expect(tool.schema).toBe(complexSchema);
    });
  });
});
