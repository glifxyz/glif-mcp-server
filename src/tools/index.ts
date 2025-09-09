import { z } from "zod";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { getSavedGlifs, SavedGlif } from "../saved-glifs.js";
import { GLIF_IDS } from "../config.js";

// Helper to check if an environment variable is truthy
function isEnvEnabled(name: string): boolean {
  const value = process.env[name]?.toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

// Types for tool structure
export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
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

// Import core tools
import * as glifInfo from "./glif-info.js";
import * as runGlif from "./run-glif.js";

// Import discovery tools
import * as listFeaturedGlifs from "./list-featured-glifs.js";
import * as searchGlifs from "./search-glifs.js";
import * as myGlifs from "./my-glifs.js";
import * as myGlifUserInfo from "./my-glif-user-info.js";

// Import metaskill tools
import * as saveGlifAsTool from "./save-glif-as-tool.js";
import * as removeGlifTool from "./remove-glif-tool.js";
import * as removeAllGlifTools from "./remove-all-glif-tools.js";
import * as listSavedGlifTools from "./list-saved-glif-tools.js";

// Bot tools - beta, disabled by default
import * as listBots from "./list-bots.js";
import * as saveBotSkillsAsTools from "./save-bot-skills-as-tools.js";
import * as loadBot from "./load-bot.js";
import * as showBotInfo from "./show-bot-info.js";

// Tool groupings
const CORE_TOOLS: ToolGroup = {
  [glifInfo.definition.name]: glifInfo,
  [runGlif.definition.name]: runGlif,
};

// Will add these as we implement the tools
const DISCOVERY_TOOLS: ToolGroup = {
  [listFeaturedGlifs.definition.name]: listFeaturedGlifs,
  [searchGlifs.definition.name]: searchGlifs,
  [myGlifs.definition.name]: myGlifs,
  [myGlifUserInfo.definition.name]: myGlifUserInfo,
};

const METASKILL_TOOLS: ToolGroup = {
  [saveGlifAsTool.definition.name]: saveGlifAsTool,
  [removeGlifTool.definition.name]: removeGlifTool,
  [removeAllGlifTools.definition.name]: removeAllGlifTools,
  [listSavedGlifTools.definition.name]: listSavedGlifTools,
};

// Bot tools - beta, disabled by default
const BOT_TOOLS: ToolGroup = {
  [listBots.definition.name]: listBots,
  [saveBotSkillsAsTools.definition.name]: saveBotSkillsAsTools,
  [loadBot.definition.name]: loadBot,
  [showBotInfo.definition.name]: showBotInfo,
};

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
          description: "Array of input values for the glif",
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
    description: `Run glif ${glifId}`,
    inputSchema: {
      type: "object",
      properties: {
        inputs: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Array of input values for the glif",
        },
      },
      required: ["inputs"],
    },
  };
}

export async function getTools(): Promise<{ tools: ToolDefinition[] }> {
  const tools: ToolDefinition[] = [];

  // 1. Add CORE tools (always available)
  tools.push(...Object.values(CORE_TOOLS).map((t) => t.definition));

  // 2. Add DISCOVERY tools (unless IGNORE_DISCOVERY_TOOLS)
  if (process.env.IGNORE_DISCOVERY_TOOLS !== "true") {
    tools.push(...Object.values(DISCOVERY_TOOLS).map((t) => t.definition));
  }

  // 3. Add METASKILL tools (unless IGNORE_METASKILL_TOOLS)
  if (process.env.IGNORE_METASKILL_TOOLS !== "true") {
    tools.push(...Object.values(METASKILL_TOOLS).map((t) => t.definition));
  }

  // 4. Add BOT tools (disabled by default, enable with BOT_TOOLS=true)
  if (isEnvEnabled("BOT_TOOLS")) {
    tools.push(...Object.values(BOT_TOOLS).map((t) => t.definition));
  }

  // 5. Add SAVED_GLIFS tools (unless IGNORE_SAVED_GLIFS)
  if (process.env.IGNORE_SAVED_GLIFS !== "true") {
    const savedGlifs = await getSavedGlifs();
    if (savedGlifs) {
      tools.push(...savedGlifs.map(createToolFromSavedGlif));
    }
  }

  // 5. Add SERVER_CONFIG_GLIFS tools (always available)
  tools.push(...GLIF_IDS.map(createToolFromGlifId));

  return { tools };
}

export function setupToolHandlers(server: Server) {
  // Register tool definitions including saved glifs
  server.setRequestHandler(ListToolsRequestSchema, async () => getTools());

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    // Check if this is a saved glif tool
    if (process.env.IGNORE_SAVED_GLIFS !== "true") {
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

    // Handle core tools
    const coreTool = CORE_TOOLS[request.params.name];
    if (coreTool) {
      return coreTool.handler(request);
    }

    // Handle discovery tools
    if (process.env.IGNORE_DISCOVERY_TOOLS !== "true") {
      const discoveryTool = DISCOVERY_TOOLS[request.params.name];
      if (discoveryTool) {
        return discoveryTool.handler(request);
      }
    }

    // Handle metaskill tools (unless IGNORE_METASKILL_TOOLS)
    if (process.env.IGNORE_METASKILL_TOOLS !== "true") {
      const metaskillTool = METASKILL_TOOLS[request.params.name];
      if (metaskillTool) {
        return metaskillTool.handler(request);
      }
    }

    // Handle bot tools (disabled by default, enable with BOT_TOOLS=true)
    if (isEnvEnabled("BOT_TOOLS")) {
      const botTool = BOT_TOOLS[request.params.name];
      if (botTool) {
        return botTool.handler(request);
      }
    }

    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${request.params.name}`
    );
  });
}
