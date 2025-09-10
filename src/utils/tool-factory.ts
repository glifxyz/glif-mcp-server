import type { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../tools/index.js";
import { parseToolArguments, type ToolRequest } from "./request-parsing.js";
import { handleApiError } from "./utils.js";

/**
 * Tool factory configuration for creating standardized tools
 */
export interface ToolConfig {
  name: string;
  description: string;
  schema: z.ZodType;
  properties: Record<string, unknown>;
  required?: string[];
}

/**
 * Handler function type for tool implementations
 */
export type ToolHandlerFn = (
  args: Record<string, unknown>
) => Promise<ToolResponse>;

/**
 * Complete tool with definition, handler, and schema
 */
export interface Tool {
  definition: ToolDefinition;
  handler: (request: ToolRequest) => Promise<ToolResponse>;
  schema: z.ZodType;
}

/**
 * Creates a standardized tool with consistent error handling and structure
 * Eliminates the need for repetitive tool definition boilerplate
 */
export function createTool(config: ToolConfig, handlerFn: ToolHandlerFn): Tool {
  const definition: ToolDefinition = {
    name: config.name,
    description: config.description,
    inputSchema: {
      type: "object",
      properties: config.properties,
      required: config.required || [],
    },
  };

  const handler = async (request: ToolRequest): Promise<ToolResponse> => {
    try {
      const args = parseToolArguments(request, config.schema) as Record<
        string,
        unknown
      >;
      return await handlerFn(args);
    } catch (error) {
      handleApiError(error, config.name);
    }
  };

  return {
    definition,
    handler,
    schema: config.schema,
  };
}

/**
 * Creates a simple text response for tools
 */
export function createTextResponse(text: string): ToolResponse {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

/**
 * Creates a formatted list response for tools
 */
export function createListResponse(
  items: string[],
  title?: string
): ToolResponse {
  const text = title ? `${title}\n\n${items.join("\n")}` : items.join("\n");

  return createTextResponse(text);
}

/**
 * Creates an error response with consistent formatting
 */
export function createErrorResponse(
  error: unknown,
  context: string
): ToolResponse {
  const errorMsg = error instanceof Error ? error.message : String(error);
  return createTextResponse(`Error in ${context}: ${errorMsg}`);
}
