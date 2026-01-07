/**
 * Centralized environment variable configuration
 */

function isEnvEnabled(name: string): boolean {
  const value = process.env[name]?.toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function isEnvDisabled(name: string): boolean {
  return process.env[name] === "true";
}

export const env = {
  // Discovery tools (search, featured, etc.)
  discovery: {
    enabled: () => !isEnvDisabled("IGNORE_DISCOVERY_TOOLS"),
  },

  // Agent tools (list_agents, load_agent)
  agents: {
    enabled: () => isEnvEnabled("AGENT_TOOLS"),
  },

  // Debug logging
  debug: {
    enabled: () => isEnvEnabled("DEBUG"),
  },

  // API configuration
  api: {
    token: () => process.env.GLIF_API_TOKEN,
  },
};

export type Env = typeof env;
