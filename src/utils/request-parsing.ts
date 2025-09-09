import { z } from "zod";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Full MCP protocol request from production usage
export type McpToolRequest = z.infer<typeof CallToolRequestSchema>;

// Simplified request format used in tests
export type TestToolRequest = {
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
};

// Union type accepting either production or test requests
export type ToolRequest = McpToolRequest | TestToolRequest;

// Schema for test requests that only have params
const TestRequestSchema = z.object({
  params: z.object({
    name: z.string().optional(),
    arguments: z.record(z.string(), z.unknown()).optional().default({}),
  }),
});

/**
 * Type-safe parser for CallToolRequest arguments
 * Handles both full MCP requests and test requests
 */
export function parseToolArguments<T>(
  request: ToolRequest,
  schema: z.ZodSchema<T>
): T {
  let args: Record<string, unknown>;

  // Try to parse as a full MCP CallToolRequest first
  const fullRequestResult = CallToolRequestSchema.safeParse(request);
  if (fullRequestResult.success) {
    args = fullRequestResult.data.params?.arguments ?? {};
  } else {
    // Fall back to test request format
    const testRequestResult = TestRequestSchema.safeParse(request);
    if (testRequestResult.success) {
      args = testRequestResult.data.params.arguments;
    } else {
      // If neither works, throw the original full request error for better debugging
      throw new Error(
        `Invalid request format: ${fullRequestResult.error.message}`
      );
    }
  }

  // Then validate the arguments against the specific schema
  return schema.parse(args);
}
