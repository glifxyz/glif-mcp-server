/**
 * Centralized environment variable configuration
 * Eliminates repeated environment variable checking patterns throughout the codebase
 */

/**
 * Helper to check if an environment variable is truthy
 */
function isEnvEnabled(name: string): boolean {
  const value = process.env[name]?.toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

/**
 * Helper to check if a feature is disabled via environment variable
 */
function isEnvDisabled(name: string): boolean {
  return process.env[name] === "true";
}

/**
 * Environment configuration for feature flags
 */
export const env = {
  // Discovery tools (search, featured, etc.)
  discovery: {
    enabled: () => !isEnvDisabled("IGNORE_DISCOVERY_TOOLS"),
  },

  // Metaskill tools (save/remove glif tools)
  metaskill: {
    enabled: () => !isEnvDisabled("IGNORE_METASKILL_TOOLS"),
  },

  // Saved glifs functionality
  savedGlifs: {
    enabled: () => !isEnvDisabled("IGNORE_SAVED_GLIFS"),
  },

  // Bot tools (experimental features)
  bots: {
    enabled: () => isEnvEnabled("BOT_TOOLS"),
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

/**
 * Type-safe environment configuration
 */
export type Env = typeof env;
