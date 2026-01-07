import { env } from "../utils/env.js";
import * as glifInfo from "./glif-info.js";
import type { ToolGroup } from "./index.js";
import * as listAgents from "./list-agents.js";
import * as listFeaturedGlifs from "./list-featured-glifs.js";
import * as loadAgent from "./load-agent.js";
import * as myGlifUserInfo from "./my-glif-user-info.js";
import * as myGlifs from "./my-glifs.js";
import * as runGlif from "./run-glif.js";
import * as searchGlifs from "./search-glifs.js";

export interface ToolGroupConfig {
  name: string;
  enabled: () => boolean;
  tools: ToolGroup;
}

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
    name: "agents",
    enabled: () => env.agents.enabled(),
    tools: {
      [listAgents.definition.name]: listAgents,
      [loadAgent.definition.name]: loadAgent,
    },
  },
];

export function getEnabledTools(): ToolGroup {
  const allTools: ToolGroup = {};

  for (const group of TOOL_REGISTRY) {
    if (group.enabled()) {
      Object.assign(allTools, group.tools);
    }
  }

  return allTools;
}
