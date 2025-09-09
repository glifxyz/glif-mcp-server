import { z } from "zod";
import { parseToolArguments, type ToolRequest } from "./request-parsing.js";
import { handleApiError } from "./utils.js";
import type { ToolResponse, ToolDefinition } from "../tools/index.js";

/**
 * Base tool configuration for consistent tool creation
 */
export interface BaseToolConfig<T extends z.ZodType> {
  name: string;
  description: string;
  schema: T;
  properties: Record<string, unknown>;
  required?: string[];
}

/**
 * Handler function type for tool implementations
 */
export type ToolHandlerFn<T> = (args: T) => Promise<ToolResponse>;

/**
 * Creates a standardized tool definition and handler with consistent error handling
 */
export function createTool<T extends z.ZodType>(
  config: BaseToolConfig<T>,
  handlerFn: ToolHandlerFn<z.infer<T>>
): {
  definition: ToolDefinition;
  handler: (request: ToolRequest) => Promise<ToolResponse>;
  schema: T;
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
      return handleApiError(error, config.name);
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