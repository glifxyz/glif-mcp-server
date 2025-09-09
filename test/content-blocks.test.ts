import { describe, it, expect, vi } from "vitest";
import { createContentBlocks } from "../src/utils/content-blocks.js";

// Mock only external dependencies
vi.mock("../src/utils/utils.js", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    logger: {
      debug: vi.fn(),
      error: vi.fn(),
    },
    convertUrlToBase64: vi.fn().mockResolvedValue("data:image/png;base64,fake-base64"),
  };
});

describe("Content Blocks", () => {
  describe("createContentBlocks", () => {
    it("should handle text output", async () => {
      const result = await createContentBlocks("Hello world", {
        type: "TEXT",
        value: "Hello world",
      });

      expect(result).toEqual([
        {
          type: "text",
          text: "Hello world",
        },
      ]);
    });

    it("should handle JSON output", async () => {
      const jsonData = { message: "test", count: 42 };
      const jsonString = JSON.stringify(jsonData);
      const result = await createContentBlocks(jsonString, {
        type: "JSON",
        value: jsonData,
      });

      expect(result).toEqual([
        {
          type: "text",
          text: jsonString,
        },
      ]);
    });

    it("should handle image URLs", async () => {
      const imageUrl = "https://example.com/image.png";
      const result = await createContentBlocks(imageUrl, {
        type: "IMAGE",
        value: imageUrl,
      });

      // Expect resource and markdown blocks for images
      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: imageUrl,
            mimeType: "image/png",
            text: `Generated image: ${imageUrl}`,
          },
        },
        {
          type: "text",
          text: `![Generated Image](${imageUrl})`,
        },
      ]);
    });

    it("should handle missing outputFull gracefully", async () => {
      const result = await createContentBlocks("fallback text", undefined);

      expect(result).toEqual([
        {
          type: "text",
          text: "No output received",
        },
      ]);
    });

    it("should handle null output gracefully", async () => {
      const result = await createContentBlocks(null, {
        type: "TEXT",
        value: "text from outputFull",
      });

      expect(result).toEqual([
        {
          type: "text",
          text: "No output received",
        },
      ]);
    });
  });
});