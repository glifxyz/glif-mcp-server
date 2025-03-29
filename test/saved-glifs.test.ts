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

// Mock the fs module
vi.mock("fs/promises");

// Mock path to saved glifs file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAVED_GLIFS_PATH = path.join(__dirname, "../config/saved-glifs.json");

describe("Saved Glifs", () => {
  // Sample glifs for testing
  const sampleGlif1: SavedGlif = {
    id: "glif-123",
    toolName: "test_tool_1",
    name: "Test Tool 1",
    description: "A test tool",
    createdAt: new Date().toISOString(),
  };

  const sampleGlif2: SavedGlif = {
    id: "glif-456",
    toolName: "test_tool_2",
    name: "Test Tool 2",
    description: "Another test tool",
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Set up default mock implementations
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue("[]");
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Clear mocks after each test
    vi.clearAllMocks();
  });

  describe("getSavedGlifs", () => {
    it("should return an empty array when no glifs are saved", async () => {
      // Mock readFile to return empty array
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("File not found"));

      const result = await getSavedGlifs();

      expect(result).toEqual([]);
      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(SAVED_GLIFS_PATH), {
        recursive: true,
      });
      expect(fs.readFile).toHaveBeenCalledWith(SAVED_GLIFS_PATH, "utf-8");
    });

    it("should return saved glifs when they exist", async () => {
      // Mock readFile to return sample glifs
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify([sampleGlif1, sampleGlif2])
      );

      const result = await getSavedGlifs();

      expect(result).toEqual([sampleGlif1, sampleGlif2]);
      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(SAVED_GLIFS_PATH), {
        recursive: true,
      });
      expect(fs.readFile).toHaveBeenCalledWith(SAVED_GLIFS_PATH, "utf-8");
    });

    it("should handle invalid JSON data", async () => {
      // Mock readFile to return invalid JSON
      vi.mocked(fs.readFile).mockResolvedValueOnce("invalid json");

      const result = await getSavedGlifs();

      expect(result).toEqual([]);
      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(SAVED_GLIFS_PATH), {
        recursive: true,
      });
      expect(fs.readFile).toHaveBeenCalledWith(SAVED_GLIFS_PATH, "utf-8");
    });
  });

  describe("saveGlif", () => {
    it("should add a new glif when it does not exist", async () => {
      // Mock readFile to return empty array
      vi.mocked(fs.readFile).mockResolvedValueOnce("[]");

      await saveGlif(sampleGlif1);

      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(SAVED_GLIFS_PATH), {
        recursive: true,
      });
      expect(fs.writeFile).toHaveBeenCalledWith(
        SAVED_GLIFS_PATH,
        JSON.stringify([sampleGlif1], null, 2)
      );
    });

    it("should update an existing glif when it exists", async () => {
      // Mock readFile to return existing glif
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify([sampleGlif1])
      );

      const updatedGlif: SavedGlif = {
        ...sampleGlif1,
        name: "Updated Test Tool",
        description: "Updated description",
      };

      await saveGlif(updatedGlif);

      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(SAVED_GLIFS_PATH), {
        recursive: true,
      });
      expect(fs.writeFile).toHaveBeenCalledWith(
        SAVED_GLIFS_PATH,
        JSON.stringify([updatedGlif], null, 2)
      );
    });

    it("should add a new glif when others exist", async () => {
      // Mock readFile to return existing glifs
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify([sampleGlif1])
      );

      await saveGlif(sampleGlif2);

      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(SAVED_GLIFS_PATH), {
        recursive: true,
      });
      expect(fs.writeFile).toHaveBeenCalledWith(
        SAVED_GLIFS_PATH,
        JSON.stringify([sampleGlif1, sampleGlif2], null, 2)
      );
    });
  });

  describe("removeGlif", () => {
    it("should return false when the glif does not exist", async () => {
      // Mock readFile to return empty array
      vi.mocked(fs.readFile).mockResolvedValueOnce("[]");

      const result = await removeGlif("non_existent_tool");

      expect(result).toBe(false);
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it("should remove the glif and return true when it exists", async () => {
      // Mock readFile to return existing glifs
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify([sampleGlif1, sampleGlif2])
      );

      const result = await removeGlif(sampleGlif1.toolName);

      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        SAVED_GLIFS_PATH,
        JSON.stringify([sampleGlif2], null, 2)
      );
    });

    it("should remove only the specified glif", async () => {
      // Mock readFile to return multiple existing glifs
      const sampleGlif3: SavedGlif = {
        id: "glif-789",
        toolName: "test_tool_3",
        name: "Test Tool 3",
        description: "Yet another test tool",
        createdAt: new Date().toISOString(),
      };

      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify([sampleGlif1, sampleGlif2, sampleGlif3])
      );

      const result = await removeGlif(sampleGlif2.toolName);

      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        SAVED_GLIFS_PATH,
        JSON.stringify([sampleGlif1, sampleGlif3], null, 2)
      );
    });
  });
});
