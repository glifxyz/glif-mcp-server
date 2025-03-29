import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  getSavedGlifs,
  saveGlif,
  removeGlif,
  SavedGlif,
} from "../src/saved-glifs";

vi.mock("fs/promises");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAVED_GLIFS_PATH = path.join(__dirname, "../config/saved-glifs.json");

const createSavedGlif = (id: string, num: number): SavedGlif => ({
  id,
  toolName: `test_tool_${num}`,
  name: `Test Tool ${num}`,
  description: `Test tool ${num} description`,
  createdAt: new Date().toISOString(),
});

describe("Saved Glifs", () => {
  let sampleGlif1: SavedGlif;
  let sampleGlif2: SavedGlif;

  beforeEach(() => {
    vi.resetAllMocks();
    sampleGlif1 = createSavedGlif("glif-123", 1);
    sampleGlif2 = createSavedGlif("glif-456", 2);

    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue("[]");
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  afterEach(() => vi.clearAllMocks());

  describe("getSavedGlifs", () => {
    it("should handle various file states", async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("File not found"));
      const emptyResult = await getSavedGlifs();
      expect(emptyResult).toEqual([]);

      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify([sampleGlif1, sampleGlif2])
      );
      const populatedResult = await getSavedGlifs();
      expect(populatedResult).toEqual([sampleGlif1, sampleGlif2]);

      vi.mocked(fs.readFile).mockResolvedValueOnce("invalid json");
      const invalidResult = await getSavedGlifs();
      expect(invalidResult).toEqual([]);

      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(SAVED_GLIFS_PATH), {
        recursive: true,
      });
    });
  });

  describe("saveGlif", () => {
    it("should handle new and existing glifs", async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce("[]");
      await saveGlif(sampleGlif1);
      expect(fs.writeFile).toHaveBeenCalledWith(
        SAVED_GLIFS_PATH,
        JSON.stringify([sampleGlif1], null, 2)
      );

      const updatedGlif = {
        ...sampleGlif1,
        name: "Updated Tool",
        description: "Updated description",
      };
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify([sampleGlif1])
      );
      await saveGlif(updatedGlif);
      expect(fs.writeFile).toHaveBeenCalledWith(
        SAVED_GLIFS_PATH,
        JSON.stringify([updatedGlif], null, 2)
      );

      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify([sampleGlif1])
      );
      await saveGlif(sampleGlif2);
      expect(fs.writeFile).toHaveBeenCalledWith(
        SAVED_GLIFS_PATH,
        JSON.stringify([sampleGlif1, sampleGlif2], null, 2)
      );
    });
  });

  describe("removeGlif", () => {
    it("should handle glif removal scenarios", async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce("[]");
      const nonExistentResult = await removeGlif("non_existent_tool");
      expect(nonExistentResult).toBe(false);
      expect(fs.writeFile).not.toHaveBeenCalled();

      const sampleGlif3 = createSavedGlif("glif-789", 3);
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify([sampleGlif1, sampleGlif2, sampleGlif3])
      );
      const existingResult = await removeGlif(sampleGlif2.toolName);
      expect(existingResult).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        SAVED_GLIFS_PATH,
        JSON.stringify([sampleGlif1, sampleGlif3], null, 2)
      );
    });
  });
});
