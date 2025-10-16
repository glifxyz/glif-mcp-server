import { env } from "../utils/env.js";
// Import core tools
import * as glifInfo from "./glif-info.js";
import type { ToolGroup } from "./index.js";
// Import bot tools
import * as listBots from "./list-bots.js";

// Import discovery tools
import * as listFeaturedGlifs from "./list-featured-glifs.js";
import * as listSavedGlifTools from "./list-saved-glif-tools.js";
import * as loadBot from "./load-bot.js";
import * as myGlifUserInfo from "./my-glif-user-info.js";
import * as myGlifs from "./my-glifs.js";

// Import metaskill tools
import * as removeAllGlifTools from "./remove-all-glif-tools.js";
import * as removeGlifTool from "./remove-glif-tool.js";
import * as runGlif from "./run-glif.js";
import * as saveBotSkillsAsTools from "./save-bot-skills-as-tools.js";
import * as saveGlifAsTool from "./save-glif-as-tool.js";
import * as searchGlifs from "./search-glifs.js";
import * as showBotInfo from "./show-bot-info.js";

/**
 * Tool group definition with enable condition
 */
export interface ToolGroupConfig {
  name: string;
  enabled: () => boolean;
  tools: ToolGroup;
}

/**
 * Centralized tool registry with conditional enable logic
 * Makes it easy to add/remove tool groups and understand what's available
 */
export const TOOL_REGISTRY: ToolGroupConfig[] = [
  {
    name: "core",
    enabled: () => true,
    tools: {
      [glifInfo.definition.name]: glifInfo,
      [runGlif.definition.name]: runGlif,
    },
  },
  {
    name: "discovery",
    enabled: () => env.discovery.enabled(),
    tools: {
      [listFeaturedGlifs.definition.name]: listFeaturedGlifs,
      [searchGlifs.definition.name]: searchGlifs,
      [myGlifs.definition.name]: myGlifs,
      [myGlifUserInfo.definition.name]: myGlifUserInfo,
    },
  },
  {
    name: "metaskill",
    enabled: () => env.metaskill.enabled(),
    tools: {
      [saveGlifAsTool.definition.name]: saveGlifAsTool,
      [removeGlifTool.definition.name]: removeGlifTool,
      [removeAllGlifTools.definition.name]: removeAllGlifTools,
      [listSavedGlifTools.definition.name]: listSavedGlifTools,
    },
  },
  {
    name: "bots",
    enabled: () => env.bots.enabled(),
    tools: {
      [listBots.definition.name]: listBots,
      [saveBotSkillsAsTools.definition.name]: saveBotSkillsAsTools,
      [loadBot.definition.name]: loadBot,
      [showBotInfo.definition.name]: showBotInfo,
    },
  },
];

/**
 * Get all enabled tools from the registry
 */
export function getEnabledTools(): ToolGroup {
  const allTools: ToolGroup = {};

  for (const group of TOOL_REGISTRY) {
    if (group.enabled()) {
      Object.assign(allTools, group.tools);
    }
  }

  return allTools;
}
