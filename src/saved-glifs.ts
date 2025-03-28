import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { logger, safeJsonParse, validateWithSchema } from "./utils.js";
import { getGlifDetails } from "./api.js";

// Define the schema for saved glifs
export const SavedGlifSchema = z.object({
  id: z.string(), // Original glif ID
  toolName: z
    .string()
    .regex(
      /^[a-zA-Z0-9_-]{1,64}$/,
      "Tool name must only contain alphanumeric characters, underscores, and hyphens, and be 1-64 characters long"
    ), // Tool name (for invocation)
  name: z.string(), // Display name
  description: z.string(), // Custom description
  createdAt: z.string().datetime(), // When it was saved
});

export type SavedGlif = z.infer<typeof SavedGlifSchema>;

// Path to the saved glifs file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAVED_GLIFS_PATH = path.join(__dirname, "../config/saved-glifs.json");

// Define a schema for raw JSON data that might have date objects
const RawGlifSchema = z.object({
  id: z.string(),
  toolName: z.string().transform((toolName) => {
    // Sanitize tool name if it doesn't match the pattern
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(toolName)) {
      return sanitizeToolName(toolName);
    }
    return toolName;
  }),
  name: z.string(),
  description: z.string(),
  createdAt: z.union([
    z.string(),
    z.object({}).transform(() => new Date().toISOString()),
    z.null().transform(() => new Date().toISOString()),
    z.undefined().transform(() => new Date().toISOString()),
  ]),
});

// Schema for parsing the file content
const FileContentSchema = z.preprocess(
  (data) => {
    if (typeof data !== "string" || !data) {
      return [];
    }

    return safeJsonParse(data, []);
  },
  z
    .array(RawGlifSchema)
    .transform((items) =>
      items.map((item) => ({
        ...item,
        // Ensure createdAt is a valid ISO string
        createdAt:
          typeof item.createdAt === "string"
            ? item.createdAt
            : new Date().toISOString(),
      }))
    )
    .pipe(z.array(SavedGlifSchema))
    .catch([])
);

/**
 * Ensure the config directory exists
 */
async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(path.dirname(SAVED_GLIFS_PATH), { recursive: true });
  } catch (err) {
    logger.debug("Error creating config directory (may already exist)", err);
  }
}

/**
 * Parse GLIF_IDS environment variable into an array of IDs
 */
function parseGlifIds(): string[] {
  const glifIds = process.env.GLIF_IDS;
  if (!glifIds) {
    return [];
  }

  return glifIds
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

/**
 * Convert a glif to SavedGlif format
 */
async function convertGlifToSavedGlif(
  glifId: string
): Promise<SavedGlif | null> {
  try {
    const { glif } = await getGlifDetails(glifId);

    // Sanitize the tool name from the glif name
    const toolName = sanitizeToolName(glif.name);

    return {
      id: glif.id,
      toolName,
      name: glif.name,
      description: glif.description || `Glif ${glif.id}`,
      createdAt: glif.createdAt,
    };
  } catch (err) {
    logger.error(`Failed to fetch glif ${glifId}:`, err);
    return null;
  }
}

export async function getSavedGlifs(): Promise<SavedGlif[]> {
  const ignoreSavedGlifs = process.env.IGNORE_SAVED_GLIFS === "true";
  const glifIds = parseGlifIds();

  // Get glifs from GLIF_IDS
  const glifsFromIds = await Promise.all(
    glifIds.map((id) => convertGlifToSavedGlif(id))
  );
  const validGlifsFromIds = glifsFromIds.filter(
    (glif): glif is SavedGlif => glif !== null
  );

  // If ignoring saved glifs, return only glifs from IDs
  if (ignoreSavedGlifs) {
    logger.debug("Ignoring saved glifs, using only GLIF_IDS", {
      count: validGlifsFromIds.length,
    });
    return validGlifsFromIds;
  }

  // Otherwise, combine with saved glifs
  // Ensure directory exists
  await ensureConfigDir();

  // Read file or return empty array if file doesn't exist
  let data = "[]";
  try {
    data = await fs.readFile(SAVED_GLIFS_PATH, "utf-8");
    logger.debug("Read saved glifs file", { size: data.length });
  } catch (err) {
    logger.debug("Saved glifs file doesn't exist, using empty array", err);
  }

  // Parse saved glifs
  const savedGlifs = FileContentSchema.parse(data);

  // Combine and deduplicate by toolName (GLIF_IDS take precedence)
  const combined = [...validGlifsFromIds];
  for (const savedGlif of savedGlifs) {
    if (!combined.some((g) => g.toolName === savedGlif.toolName)) {
      combined.push(savedGlif);
    }
  }

  logger.debug("Combined glifs", {
    fromIds: validGlifsFromIds.length,
    fromSaved: savedGlifs.length,
    total: combined.length,
  });

  return combined;
}

// Validate tool name against the pattern ^[a-zA-Z0-9_-]{1,64}$
function isValidToolName(toolName: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(toolName);
}

// Sanitize tool name to match the pattern ^[a-zA-Z0-9_-]{1,64}$
function sanitizeToolName(toolName: string): string {
  return toolName
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .substring(0, 64)
    .replace(/_+$/, ""); // Remove trailing underscores
}

export async function saveGlif(glif: SavedGlif): Promise<void> {
  // Validate and sanitize the tool name
  if (!isValidToolName(glif.toolName)) {
    logger.info("Invalid tool name, sanitizing", {
      original: glif.toolName,
      sanitized: sanitizeToolName(glif.toolName),
    });
    glif.toolName = sanitizeToolName(glif.toolName);
  }

  logger.debug("Saving glif", { toolName: glif.toolName });

  const glifs = await getSavedGlifs();
  const existingIndex = glifs.findIndex((g) => g.toolName === glif.toolName);

  if (existingIndex >= 0) {
    glifs[existingIndex] = glif;
    logger.debug("Updated existing glif", { toolName: glif.toolName });
  } else {
    glifs.push(glif);
    logger.debug("Added new glif", { toolName: glif.toolName });
  }

  await ensureConfigDir();
  await fs.writeFile(SAVED_GLIFS_PATH, JSON.stringify(glifs, null, 2));
}

export async function removeGlif(toolName: string): Promise<boolean> {
  logger.debug("Removing glif", { toolName });

  const glifs = await getSavedGlifs();
  const initialLength = glifs.length;
  const filteredGlifs = glifs.filter((g) => g.toolName !== toolName);

  if (filteredGlifs.length < initialLength) {
    await fs.writeFile(
      SAVED_GLIFS_PATH,
      JSON.stringify(filteredGlifs, null, 2)
    );
    logger.debug("Glif removed successfully", { toolName });
    return true;
  }

  logger.debug("Glif not found for removal", { toolName });
  return false;
}

export async function removeAllGlifs(): Promise<number> {
  try {
    // Ensure directory exists
    await ensureConfigDir();

    // Get current count for reporting
    const currentGlifs = await getSavedGlifs();
    const count = currentGlifs.length;

    // Write empty array to file
    await fs.writeFile(SAVED_GLIFS_PATH, "[]");

    logger.debug("Removed all glifs", { count });
    return count;
  } catch (err) {
    logger.error("Error removing all glifs:", err);
    return 0;
  }
}
