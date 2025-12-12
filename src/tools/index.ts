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
import { getSavedGlifs, type SavedGlif } from "../saved-glifs.js";
import { env } from "../utils/env.js";
import { logger } from "../utils/utils.js";

// Types for tool structure
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

// Use the official MCP ContentBlock types for multimedia support
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

// Helper to create a tool definition from a saved glif
function createToolFromSavedGlif(glif: SavedGlif): ToolDefinition {
  return {
    name: glif.toolName,
    description: `${glif.name}: ${glif.description}`,
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

// Helper to create a tool definition from a glif ID
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

  // 1. Add all enabled tools from registry
  const enabledTools = getEnabledTools();
  tools.push(...Object.values(enabledTools).map((t) => t.definition));

  // 2. Add SAVED_GLIFS tools (unless disabled)
  if (env.savedGlifs.enabled()) {
    const savedGlifs = await getSavedGlifs();
    if (savedGlifs) {
      tools.push(...savedGlifs.map(createToolFromSavedGlif));
    }
  }

  // 3. Add SERVER_CONFIG_GLIFS tools (always available)
  tools.push(...GLIF_IDS.map(createToolFromGlifId));

  return { tools };
}

/**
 * Setup tool handlers using low-level Server API
 * This approach supports dynamic tool registration at runtime
 * (saved glifs are re-read on each tool call)
 */
export function setupToolHandlers(server: Server) {
  logger.debug("Setting up tool handlers (low-level API)");

  // Register tool definitions including saved glifs
  // getTools() is called on each listTools request, so new saved glifs appear immediately
  server.setRequestHandler(ListToolsRequestSchema, async () => getTools());

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    logger.debug("Tool call received", {
      name: request.params.name,
      args: request.params.arguments,
    });

    // Check if this is a saved glif tool
    // Re-reading savedGlifs on each call ensures newly saved tools work immediately
    if (env.savedGlifs.enabled()) {
      const savedGlifs = await getSavedGlifs();
      const savedGlif = savedGlifs?.find(
        (g) => g.toolName === request.params.name
      );

      if (savedGlif && request.params.arguments) {
        const args = z
          .object({ inputs: z.array(z.string()) })
          .parse(request.params.arguments);
        return runGlif.handler({
          ...request,
          params: {
            ...request.params,
            arguments: {
              id: savedGlif.id,
              inputs: args.inputs,
            },
          },
        });
      }
    }

    // Check if this is a server config glif tool
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
