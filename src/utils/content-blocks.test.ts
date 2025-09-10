import type { ContentBlock } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createContentBlocks,
  createStructuredContent,
  truncateBase64InContentBlocks,
} from "./content-blocks.js";

// Helper to create mock server for testing HTTP requests
let originalConsoleError: typeof console.error;

beforeEach(() => {
  // Capture console.error to test debug logging without polluting test output
  originalConsoleError = console.error;
  console.error = () => {}; // Suppress debug logs during tests
});

function restoreConsole() {
  console.error = originalConsoleError;
}

describe("Content Blocks", () => {
  describe("createContentBlocks", () => {
    it("should handle text output", async () => {
      const result = await createContentBlocks("Hello world", {
        type: "TEXT",
      });

      expect(result).toEqual([
        {
          type: "text",
          text: "Hello world",
        },
      ]);
    });

    it("should handle JSON data output without code blocks", async () => {
      const jsonData = { message: "test", count: 42 };
      const jsonString = JSON.stringify(jsonData);
      const result = await createContentBlocks(jsonString, {
        type: "JSON",
      });

      expect(result).toEqual([
        {
          type: "text",
          text: jsonString,
        },
      ]);
    });

    it("should handle JSON URL with resource_link", async () => {
      const jsonUrl = "https://api.example.com/data.json";
      const result = await createContentBlocks(jsonUrl, {
        type: "JSON",
      });

      expect(result).toEqual([
        {
          type: "resource_link",
          uri: jsonUrl,
          name: "JSON Data",
          mimeType: "application/json",
        },
        {
          type: "text",
          text: jsonUrl,
        },
      ]);
    });

    it("should handle HTML content with data URI resource_link", async () => {
      const htmlContent = "<div><p>Hello World</p></div>";
      const result = await createContentBlocks(htmlContent, {
        type: "HTML",
      });

      expect(result.length).toBe(2);

      // Check resource_link with data URI
      const resourceBlock = result.find(
        (block) => block.type === "resource_link"
      );
      expect(resourceBlock?.type).toBe("resource_link");
      expect(resourceBlock?.name).toBe("Generated HTML");
      expect(resourceBlock?.mimeType).toBe("text/html");
      expect(resourceBlock?.uri).toMatch(/^data:text\/html;charset=utf-8,/);

      // Check text format
      const textBlock = result.find((block) => block.type === "text");
      expect(textBlock).toEqual({
        type: "text",
        text: htmlContent,
      });
    });

    it("should handle HTML URL with resource_link", async () => {
      const htmlUrl = "https://example.com/page.html";
      const result = await createContentBlocks(htmlUrl, {
        type: "HTML",
      });

      expect(result).toEqual([
        {
          type: "resource_link",
          uri: htmlUrl,
          name: "Web Page",
          mimeType: "text/html",
        },
        {
          type: "text",
          text: htmlUrl,
        },
      ]);
    });

    it("should handle valid image URLs with multiple formats", async () => {
      const imageUrl = "https://example.com/test.png";
      const result = await createContentBlocks(imageUrl, {
        type: "IMAGE",
      });

      // Should include resource_link and text formats (base64 will fail for example.com but that's expected)
      expect(result.length).toBeGreaterThanOrEqual(2);

      // Check resource_link format
      const resourceBlock = result.find(
        (block) => block.type === "resource_link"
      );
      expect(resourceBlock).toEqual({
        type: "resource_link",
        uri: imageUrl,
        name: "Generated Image",
        mimeType: "image/png",
      });

      // Check text format with markdown
      const textBlock = result.find((block) => block.type === "text");
      expect(textBlock).toEqual({
        type: "text",
        text: `![Generated Image](${imageUrl})`,
      });
    });

    it("should handle valid audio URLs with multiple formats", async () => {
      const audioUrl = "https://example.com/audio.mp3";
      const result = await createContentBlocks(audioUrl, {
        type: "AUDIO",
      });

      // Should include resource_link and text formats
      expect(result.length).toBeGreaterThanOrEqual(2);

      // Check resource_link format
      const resourceBlock = result.find(
        (block) => block.type === "resource_link"
      );
      expect(resourceBlock).toEqual({
        type: "resource_link",
        uri: audioUrl,
        name: "Generated Audio",
        mimeType: "audio/mpeg",
      });

      // Check text format with emoji
      const textBlock = result.find((block) => block.type === "text");
      expect(textBlock).toEqual({
        type: "text",
        text: `🔊 Audio: ${audioUrl}`,
      });
    }, 10000);

    it("should handle valid video URLs with resource_link only", async () => {
      const videoUrl = "https://example.com/video.mp4";
      const result = await createContentBlocks(videoUrl, {
        type: "VIDEO",
      });

      // Should include resource_link and text formats (no base64 for video)
      expect(result.length).toBe(2);

      // Check resource_link format
      const resourceBlock = result.find(
        (block) => block.type === "resource_link"
      );
      expect(resourceBlock).toEqual({
        type: "resource_link",
        uri: videoUrl,
        name: "Generated Video",
        mimeType: "video/mp4",
      });

      // Check text format with emoji
      const textBlock = result.find((block) => block.type === "text");
      expect(textBlock).toEqual({
        type: "text",
        text: `🎥 Video: ${videoUrl}`,
      });
    });

    it("should handle invalid URLs gracefully", async () => {
      const invalidUrl = "not-a-valid-image-url";
      const result = await createContentBlocks(invalidUrl, {
        type: "IMAGE",
      });

      expect(result).toEqual([
        {
          type: "text",
          text: `[Image] ${invalidUrl}`,
        },
      ]);
    });

    it("should handle unsupported file types gracefully", async () => {
      const unsupportedUrl = "https://example.com/file.unknown";
      const result = await createContentBlocks(unsupportedUrl, {
        type: "IMAGE",
      });

      expect(result).toEqual([
        {
          type: "text",
          text: `[Image] ${unsupportedUrl}`,
        },
      ]);
    });

    it("should handle URLs without file extensions gracefully", async () => {
      const urlWithoutExtension = "https://httpbin.org/image/png";
      const result = await createContentBlocks(urlWithoutExtension, {
        type: "IMAGE",
      });

      // URLs without proper extensions fall back to text format
      expect(result).toEqual([
        {
          type: "text",
          text: `[Image] ${urlWithoutExtension}`,
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
      });

      expect(result).toEqual([
        {
          type: "text",
          text: "No output received",
        },
      ]);
    });

    it("should handle case insensitive types", async () => {
      const result = await createContentBlocks("test", {
        type: "text", // lowercase
      });

      expect(result).toEqual([
        {
          type: "text",
          text: "test",
        },
      ]);
    });
  });

  describe("createStructuredContent", () => {
    it("should create structured content for valid JSON", () => {
      const jsonData = { message: "test", count: 42 };
      const jsonString = JSON.stringify(jsonData);
      const result = createStructuredContent(jsonString, {
        type: "JSON",
      });

      expect(result).toEqual(jsonData);
    });

    it("should return null for non-JSON types", () => {
      const result = createStructuredContent("test", {
        type: "TEXT",
      });

      expect(result).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      const result = createStructuredContent("invalid json{", {
        type: "JSON",
      });

      expect(result).toBeNull();
    });

    it("should create structured content for JSON arrays", () => {
      const arrayData = [
        { id: 1, name: "test" },
        { id: 2, name: "test2" },
      ];
      const arrayString = JSON.stringify(arrayData);
      const result = createStructuredContent(arrayString, {
        type: "JSON",
      });

      expect(result).toEqual({ data: arrayData });
    });

    it("should return null for primitive JSON values", () => {
      const result = createStructuredContent('"just a string"', {
        type: "JSON",
      });

      expect(result).toBeNull();
    });

    it("should handle null output", () => {
      const result = createStructuredContent(null, {
        type: "JSON",
      });

      expect(result).toBeNull();
    });
  });

  describe("truncateBase64InContentBlocks", () => {
    it("should truncate base64 data in image blocks", () => {
      const blocks: ContentBlock[] = [
        {
          type: "image",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          mimeType: "image/png",
        },
        {
          type: "text",
          text: "Some text",
        },
      ];

      const result = truncateBase64InContentBlocks(blocks);

      expect(result).toEqual([
        {
          type: "image",
          data: "[base64_encoded_data_hidden]",
          mimeType: "image/png",
        },
        {
          type: "text",
          text: "Some text",
        },
      ]);
    });

    it("should truncate base64 data in audio blocks", () => {
      const blocks: ContentBlock[] = [
        {
          type: "audio",
          data: "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaLITQp7GJMw",
          mimeType: "audio/wav",
        },
      ];

      const result = truncateBase64InContentBlocks(blocks);

      expect(result[0]).toEqual({
        type: "audio",
        data: "[base64_encoded_data_hidden]",
        mimeType: "audio/wav",
      });
    });

    it("should not truncate other block types", () => {
      const blocks: ContentBlock[] = [
        {
          type: "text",
          text: "Some text with data property",
        },
        {
          type: "resource_link",
          uri: "https://example.com/image.png",
          name: "Test Image",
          mimeType: "image/png",
        },
      ];

      const result = truncateBase64InContentBlocks(blocks);

      expect(result).toEqual(blocks);
    });

    it("should handle empty data gracefully", () => {
      const blocks: ContentBlock[] = [
        {
          type: "image",
          data: "",
          mimeType: "image/png",
        },
      ];

      const result = truncateBase64InContentBlocks(blocks);

      expect(result[0]).toEqual({
        type: "image",
        data: "",
        mimeType: "image/png",
      });
    });
  });

  // Cleanup
  afterEach(() => {
    restoreConsole();
  });
});
