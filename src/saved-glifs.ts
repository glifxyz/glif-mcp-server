import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { logger, safeJsonParse, validateWithSchema } from "./utils.js";

// Define the schema for saved glifs
export const SavedGlifSchema = z.object({
  id: z.string(), // Original glif ID
  toolName: z.string(), // Tool name (for invocation)
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
  toolName: z.string(),
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

export async function getSavedGlifs(): Promise<SavedGlif[]> {
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

  // Parse and validate with our schema
  return FileContentSchema.parse(data);
}

export async function saveGlif(glif: SavedGlif): Promise<void> {
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
