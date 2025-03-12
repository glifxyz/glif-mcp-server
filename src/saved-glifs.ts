import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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

// Functions to manage saved glifs
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

    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
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

export async function getSavedGlifs(): Promise<SavedGlif[]> {
  // Ensure directory exists
  try {
    await fs.mkdir(path.dirname(SAVED_GLIFS_PATH), { recursive: true });
  } catch (err) {
    // Ignore directory creation errors
  }

  // Read file or return empty array if file doesn't exist
  let data = "[]";
  try {
    data = await fs.readFile(SAVED_GLIFS_PATH, "utf-8");
  } catch (err) {
    // File doesn't exist, use empty array
  }

  // Parse and validate with our schema
  return FileContentSchema.parse(data);
}

export async function saveGlif(glif: SavedGlif): Promise<void> {
  const glifs = await getSavedGlifs();
  const existingIndex = glifs.findIndex((g) => g.toolName === glif.toolName);

  if (existingIndex >= 0) {
    glifs[existingIndex] = glif;
  } else {
    glifs.push(glif);
  }

  await fs.mkdir(path.dirname(SAVED_GLIFS_PATH), { recursive: true });
  await fs.writeFile(SAVED_GLIFS_PATH, JSON.stringify(glifs, null, 2));
}

export async function removeGlif(toolName: string): Promise<boolean> {
  const glifs = await getSavedGlifs();
  const initialLength = glifs.length;
  const filteredGlifs = glifs.filter((g) => g.toolName !== toolName);

  if (filteredGlifs.length < initialLength) {
    await fs.writeFile(
      SAVED_GLIFS_PATH,
      JSON.stringify(filteredGlifs, null, 2)
    );
    return true;
  }

  return false;
}

export async function removeAllGlifs(): Promise<number> {
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(SAVED_GLIFS_PATH), { recursive: true });

    // Get current count for reporting
    const currentGlifs = await getSavedGlifs();
    const count = currentGlifs.length;

    // Write empty array to file
    await fs.writeFile(SAVED_GLIFS_PATH, "[]");

    return count;
  } catch (err) {
    console.error("Error removing all glifs:", err);
    return 0;
  }
}
