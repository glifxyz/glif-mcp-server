import { z } from "zod";
import { parseToolArguments, type ToolRequest } from "./request-parsing.js";
import { handleApiError } from "./utils.js";
import type { ToolResponse, ToolDefinition } from "../tools/index.js";

/**
 * Base tool configuration for consistent tool creation
 */
export interface BaseToolConfig {
  name: string;
  description: string;
  schema: z.ZodType;
  properties: Record<string, unknown>;
  required?: string[];
}

/**
 * Handler function type for tool implementations
 */
export type ToolHandlerFn = (args: any) => Promise<ToolResponse>;

/**
 * Creates a standardized tool definition and handler with consistent error handling
 */
export function createTool(
  config: BaseToolConfig,
  handlerFn: ToolHandlerFn
): {
  definition: ToolDefinition;
  handler: (request: ToolRequest) => Promise<ToolResponse>;
  schema: z.ZodType;
} {
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
      const args = parseToolArguments(request, config.schema);
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
export function createListResponse(items: string[], title?: string): ToolResponse {
  const text = title
    ? `${title}\n\n${items.join("\n")}`
    : items.join("\n");

  return createTextResponse(text);
}