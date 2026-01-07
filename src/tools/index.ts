import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  type CallToolResult,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type ToolAnnotations,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { GLIF_IDS } from "../config.js";
import { logger } from "../utils/utils.js";

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  annotations?: ToolAnnotations;
};

export type ToolResponse = CallToolResult;

export type ToolHandler = (
  request: z.infer<typeof CallToolRequestSchema>
) => Promise<ToolResponse>;

export type Tool = {
  definition: ToolDefinition;
  handler: ToolHandler;
  schema: z.ZodType;
};

export type ToolGroup = {
  [key: string]: Tool;
};

import { getEnabledTools } from "./registry.js";
import * as runGlif from "./run-glif.js";

// Helper to create a tool definition from a glif ID (for GLIF_IDS env var)
function createToolFromGlifId(glifId: string) {
  return {
    name: `glif_${glifId}`,
    description: `Run workflow ${glifId}`,
    inputSchema: {
      type: "object",
      properties: {
        inputs: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Array of input values for the workflow",
        },
      },
      required: ["inputs"],
    },
  };
}

export async function getTools(): Promise<{ tools: ToolDefinition[] }> {
  const tools: ToolDefinition[] = [];

  // Add all enabled tools from registry
  const enabledTools = getEnabledTools();
  tools.push(...Object.values(enabledTools).map((t) => t.definition));

  // Add GLIF_IDS tools (from env var config)
  tools.push(...GLIF_IDS.map(createToolFromGlifId));

  return { tools };
}

export function setupToolHandlers(server: Server) {
  logger.debug("Setting up tool handlers");

  server.setRequestHandler(ListToolsRequestSchema, async () => getTools());

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    logger.debug("Tool call received", {
      name: request.params.name,
      args: request.params.arguments,
    });

    // Check if this is a GLIF_IDS tool
    const glifIdMatch = request.params.name.match(/^glif_(.+)$/);
    const glifId = glifIdMatch?.[1];
    if (
      glifIdMatch &&
      glifId &&
      GLIF_IDS.includes(glifId) &&
      request.params.arguments
    ) {
      const args = z
        .object({ inputs: z.array(z.string()) })
        .parse(request.params.arguments);
      return runGlif.handler({
        ...request,
        params: {
          ...request.params,
          arguments: {
            id: glifId,
            inputs: args.inputs,
          },
        },
      });
    }

    // Handle all registered tools
    const enabledTools = getEnabledTools();
    const tool = enabledTools[request.params.name];
    if (tool) {
      return tool.handler(request);
    }

    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${request.params.name}`
    );
  });
}
