import type { Glif } from "../types.js";

/**
 * Configuration options for glif formatting
 */
export interface GlifFormatOptions {
  includeUser?: boolean;
  includeRuns?: boolean;
  includeCreatedDate?: boolean;
  includeLikes?: boolean;
  dateFormat?: "locale" | "iso";
}

/**
 * Default formatting options
 */
const DEFAULT_OPTIONS: Required<GlifFormatOptions> = {
  includeUser: true,
  includeRuns: true,
  includeCreatedDate: false,
  includeLikes: false,
  dateFormat: "locale",
};

/**
 * Formats a single glif for display
 * Centralizes the glif formatting logic that was duplicated across multiple files
 */
export function formatGlif(
  glif: Glif,
  options: GlifFormatOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let formatted = `${glif.name} (${glif.id})`;

  if (glif.description) {
    formatted += `\n${glif.description}`;
  }

  if (opts.includeUser && glif.user) {
    formatted += `\nBy: ${glif.user.name}`;
  }

  if (opts.includeRuns && typeof glif.completedSpellRunCount === "number") {
    formatted += `\nRuns: ${glif.completedSpellRunCount}`;
  }

  if (opts.includeCreatedDate && glif.createdAt) {
    const date = new Date(glif.createdAt);
    const formattedDate =
      opts.dateFormat === "locale" ? date.toLocaleString() : date.toISOString();
    formatted += `\nCreated: ${formattedDate}`;
  }

  if (opts.includeLikes && typeof glif.likeCount === "number") {
    formatted += `\nLikes: ${glif.likeCount}`;
  }

  return formatted;
}

/**
 * Formats multiple glifs for display
 */
export function formatGlifList(
  glifs: Glif[],
  options: GlifFormatOptions = {}
): string {
  if (glifs.length === 0) {
    return "No glifs found.";
  }

  return glifs.map((glif) => formatGlif(glif, options)).join("\n\n");
}

/**
 * Formats glifs for search results (includes user and runs by default)
 */
export function formatGlifSearchResults(glifs: Glif[]): string {
  return formatGlifList(glifs, {
    includeUser: true,
    includeRuns: true,
  });
}

/**
 * Formats glifs for user's own glif list (includes creation date)
 */
export function formatMyGlifs(glifs: Glif[]): string {
  return formatGlifList(glifs, {
    includeUser: false,
    includeRuns: true,
    includeCreatedDate: true,
  });
}

/**
 * Formats glifs for featured list (includes user and likes)
 */
export function formatFeaturedGlifs(glifs: Glif[]): string {
  return formatGlifList(glifs, {
    includeUser: true,
    includeRuns: true,
    includeLikes: true,
  });
}
