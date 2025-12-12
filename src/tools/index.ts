import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
 * Register all tools with the McpServer using the high-level API
 * This function is called from index.ts during server initialization
 */
export async function registerAllTools(server: McpServer): Promise<void> {
  console.error(
    "[DEBUG] Setting up tool handlers V3.0 (McpServer high-level API)"
  );

  // Get all enabled static tools from registry
  const enabledTools = getEnabledTools();

  // Register each static tool with McpServer
  for (const [name, tool] of Object.entries(enabledTools)) {
    server.tool(
      name,
      tool.definition.description,
      tool.definition.inputSchema as any,
      async (args: Record<string, unknown>) => {
        const request = {
          method: "tools/call" as const,
          params: {
            name,
            arguments: args,
          },
        };
        return tool.handler(request);
      }
    );
  }

  // Register dynamic tools for saved glifs
  if (env.savedGlifs.enabled()) {
    const savedGlifs = await getSavedGlifs();
    if (savedGlifs) {
      for (const glif of savedGlifs) {
        registerSavedGlifTool(server, glif);
      }
    }
  }

  // Register tools for GLIF_IDS from config
  for (const glifId of GLIF_IDS) {
    registerConfigGlifTool(server, glifId);
  }
}

/**
 * Register a saved glif as a tool
 */
function registerSavedGlifTool(server: McpServer, glif: SavedGlif): void {
  const inputSchema = {
    type: "object" as const,
    properties: {
      inputs: {
        type: "array",
        items: { type: "string" },
        description: "Array of input values for the workflow",
      },
    },
    required: ["inputs"],
  };

  server.tool(
    glif.toolName,
    `${glif.name}: ${glif.description}`,
    inputSchema as any,
    async (args: Record<string, unknown>) => {
      const inputs = args.inputs as string[];
      const request = {
        method: "tools/call" as const,
        params: {
          name: "run_glif",
          arguments: {
            id: glif.id,
            inputs,
          },
        },
      };
      return runGlif.handler(request);
    }
  );
}

/**
 * Register a config glif (from GLIF_IDS env var) as a tool
 */
function registerConfigGlifTool(server: McpServer, glifId: string): void {
  const inputSchema = {
    type: "object" as const,
    properties: {
      inputs: {
        type: "array",
        items: { type: "string" },
        description: "Array of input values for the workflow",
      },
    },
    required: ["inputs"],
  };

  server.tool(
    `glif_${glifId}`,
    `Run workflow ${glifId}`,
    inputSchema as any,
    async (args: Record<string, unknown>) => {
      const inputs = args.inputs as string[];
      const request = {
        method: "tools/call" as const,
        params: {
          name: "run_glif",
          arguments: {
            id: glifId,
            inputs,
          },
        },
      };
      return runGlif.handler(request);
    }
  );
}

/**
 * Legacy setup function for backward compatibility with tests
 * Uses the low-level Server API
 */
export function setupToolHandlers(server: Server) {
  console.error(
    "[DEBUG] Setting up tool handlers V2.0 (MCP multimedia support)"
  );

  // Register tool definitions including saved glifs
  server.setRequestHandler(ListToolsRequestSchema, async () => getTools());

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    console.error("[DEBUG] Tool call received:", {
      name: request.params.name,
      args: request.params.arguments,
    });

    // Check if this is a saved glif tool
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
