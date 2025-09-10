import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  formatOutput,
  getMimeType,
  handleApiError,
  isAudioUrl,
  isImageUrl,
  isVideoUrl,
  logger,
  safeJsonParse,
  urlToBase64,
  validateWithSchema,
} from "./utils.js";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error to test logger
const mockConsoleError = vi.fn();
vi.stubGlobal("console", { error: mockConsoleError });

describe("Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  describe("urlToBase64", () => {
    it("should convert valid image URL to base64", async () => {
      const mockArrayBuffer = new ArrayBuffer(10);
      const mockResponse = {
        ok: true,
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
        headers: new Map([["content-length", "10"]]),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await urlToBase64("https://example.com/image.png");

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/image.png",
        expect.objectContaining({
          headers: expect.objectContaining({
            Range: "bytes=0-10485760",
            "User-Agent": "glif-mcp-server/1.0",
          }),
        })
      );
    });

    it("should reject private/local IP addresses (SSRF protection)", async () => {
      const privateUrls = [
        "http://localhost/test",
        "http://127.0.0.1/test",
        "http://10.0.0.1/test",
        "http://192.168.1.1/test",
        "http://172.16.0.1/test",
        "http://0.0.0.0/test",
      ];

      for (const url of privateUrls) {
        await expect(urlToBase64(url)).rejects.toThrow(
          /Private\/local IP addresses not allowed/
        );
      }
    });

    it("should reject non-HTTP/HTTPS protocols", async () => {
      const invalidUrls = [
        "ftp://example.com/file",
        "file:///etc/passwd",
        "javascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
      ];

      for (const url of invalidUrls) {
        await expect(urlToBase64(url)).rejects.toThrow(
          /Invalid protocol.*Only HTTP\/HTTPS allowed/
        );
      }
    });

    it("should reject files larger than 10MB", async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([["content-length", "20971520"]]), // 20MB
      };

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        urlToBase64("https://example.com/large.jpg")
      ).rejects.toThrow(/File too large.*max 10MB/);
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(
        urlToBase64("https://example.com/notfound.jpg")
      ).rejects.toThrow(/HTTP 404: Not Found/);
    });

    it("should handle network timeouts", async () => {
      // Mock a fetch that rejects after timeout
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Request timeout")), 100);
          })
      );

      await expect(
        urlToBase64("https://example.com/slow.jpg")
      ).rejects.toThrow();
    });

    it("should handle fetch network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(
        urlToBase64("https://example.com/image.jpg")
      ).rejects.toThrow(/URL conversion failed.*Network error/);
    });

    it("should check final file size after download", async () => {
      const largeBuffer = new ArrayBuffer(15728640); // 15MB
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(largeBuffer),
        headers: new Map([["content-length", "1000"]]), // Lies about size
      });

      await expect(
        urlToBase64("https://example.com/tricky.jpg")
      ).rejects.toThrow(/Downloaded file too large.*max 10MB/);
    });
  });

  describe("getMimeType", () => {
    it("should return correct MIME types for supported extensions", () => {
      const testCases = [
        ["https://example.com/image.png", "image/png"],
        ["https://example.com/photo.jpg", "image/jpeg"],
        ["https://example.com/photo.jpeg", "image/jpeg"],
        ["https://example.com/animation.gif", "image/gif"],
        ["https://example.com/modern.webp", "image/webp"],
        ["https://example.com/vector.svg", "image/svg+xml"],
        ["https://example.com/video.mp4", "video/mp4"],
        ["https://example.com/video.webm", "video/webm"],
        ["https://example.com/video.mov", "video/quicktime"],
        ["https://example.com/audio.mp3", "audio/mpeg"],
        ["https://example.com/audio.wav", "audio/wav"],
        ["https://example.com/audio.ogg", "audio/ogg"],
        ["https://example.com/audio.m4a", "audio/mp4"],
      ];

      testCases.forEach(([url, expectedMime]) => {
        expect(getMimeType(url)).toBe(expectedMime);
      });
    });

    it("should return default MIME type for unknown extensions", () => {
      const unknownUrls = [
        "https://example.com/file.unknown",
        "https://example.com/file.exe",
        "https://example.com/file",
        "https://example.com/",
      ];

      unknownUrls.forEach((url) => {
        expect(getMimeType(url)).toBe("application/octet-stream");
      });
    });

    it("should handle malformed URLs gracefully", () => {
      expect(getMimeType("not-a-url")).toBe("application/octet-stream");
      expect(getMimeType("")).toBe("application/octet-stream");
    });
  });

  describe("URL type checking functions", () => {
    it("isImageUrl should correctly identify image URLs", () => {
      expect(isImageUrl("https://example.com/image.png")).toBe(true);
      expect(isImageUrl("https://example.com/photo.jpg")).toBe(true);
      expect(isImageUrl("https://example.com/video.mp4")).toBe(false);
      expect(isImageUrl("https://example.com/audio.mp3")).toBe(false);
    });

    it("isAudioUrl should correctly identify audio URLs", () => {
      expect(isAudioUrl("https://example.com/audio.mp3")).toBe(true);
      expect(isAudioUrl("https://example.com/sound.wav")).toBe(true);
      expect(isAudioUrl("https://example.com/video.mp4")).toBe(false);
      expect(isAudioUrl("https://example.com/image.png")).toBe(false);
    });

    it("isVideoUrl should correctly identify video URLs", () => {
      expect(isVideoUrl("https://example.com/video.mp4")).toBe(true);
      expect(isVideoUrl("https://example.com/clip.webm")).toBe(true);
      expect(isVideoUrl("https://example.com/audio.mp3")).toBe(false);
      expect(isVideoUrl("https://example.com/image.png")).toBe(false);
    });
  });

  describe("formatOutput (legacy function)", () => {
    it("should format different output types correctly", () => {
      expect(formatOutput("IMAGE", "https://example.com/image.png")).toBe(
        "[Image] https://example.com/image.png ![](https://example.com/image.png)"
      );
      expect(formatOutput("VIDEO", "https://example.com/video.mp4")).toBe(
        "[Video] https://example.com/video.mp4"
      );
      expect(formatOutput("AUDIO", "https://example.com/audio.mp3")).toBe(
        "[Audio] https://example.com/audio.mp3"
      );
      expect(formatOutput("TEXT", "Hello world")).toBe("Hello world");
      expect(formatOutput("UNKNOWN", "Some content")).toBe("Some content");
    });
  });

  describe("handleApiError", () => {
    it("should re-throw McpError without modification", () => {
      const mcpError = new McpError(ErrorCode.InvalidRequest, "Test error");

      expect(() => handleApiError(mcpError, "test context")).toThrow(mcpError);
    });

    it("should convert regular errors to McpError", () => {
      const regularError = new Error("Regular error");

      expect(() => handleApiError(regularError, "test context")).toThrow(
        McpError
      );
      expect(() => handleApiError(regularError, "test context")).toThrow(
        /API error: Regular error/
      );
    });

    it("should handle non-Error objects", () => {
      expect(() => handleApiError("string error", "test context")).toThrow(
        /API error: string error/
      );
      expect(() =>
        handleApiError({ message: "object error" }, "test context")
      ).toThrow(/API error: \[object Object\]/);
    });

    it("should log errors with context", () => {
      const error = new Error("Test error");

      expect(() => handleApiError(error, "test context")).toThrow();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "[ERROR] handleApiError, test context:",
        error
      );
    });
  });

  describe("safeJsonParse", () => {
    it("should parse valid JSON", () => {
      const validJson = '{"key": "value", "number": 42}';
      const result = safeJsonParse(validJson, {});

      expect(result).toEqual({ key: "value", number: 42 });
    });

    it("should return fallback for invalid JSON", () => {
      const invalidJson = '{"invalid": json}';
      const fallback = { error: true };
      const result = safeJsonParse(invalidJson, fallback);

      expect(result).toBe(fallback);
    });

    it("should return fallback for empty string", () => {
      const fallback = null;
      const result = safeJsonParse("", fallback);

      expect(result).toBe(fallback);
    });
  });

  describe("validateWithSchema", () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it("should validate correct data", () => {
      const validData = { name: "John", age: 30 };
      const result = validateWithSchema(testSchema, validData, "test context");

      expect(result).toEqual(validData);
    });

    it("should throw McpError for invalid data", () => {
      const invalidData = { name: "John", age: "thirty" };

      expect(() =>
        validateWithSchema(testSchema, invalidData, "test context")
      ).toThrow(McpError);
      expect(() =>
        validateWithSchema(testSchema, invalidData, "test context")
      ).toThrow(/Data validation error/);
    });

    it("should log validation errors", () => {
      const invalidData = { name: 123, age: "thirty" };

      expect(() =>
        validateWithSchema(testSchema, invalidData, "test context")
      ).toThrow();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "[ERROR] Validation error in test context:",
        expect.any(Object)
      );
    });
  });

  describe("logger", () => {
    it("should log error messages", () => {
      logger.error("Test error", new Error("details"));

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[ERROR] Test error",
        new Error("details")
      );
    });

    it("should log info messages", () => {
      logger.info("Test info", { data: "test" });

      expect(mockConsoleError).toHaveBeenCalledWith("[INFO] Test info", {
        data: "test",
      });
    });

    it("should log debug messages when DEBUG=true", () => {
      process.env.DEBUG = "true";
      logger.debug("Test debug", { debug: true });

      expect(mockConsoleError).toHaveBeenCalledWith("[DEBUG] Test debug", {
        debug: true,
      });
    });

    it("should not log debug messages when DEBUG is not set", () => {
      logger.debug("Test debug", { debug: true });

      expect(mockConsoleError).not.toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG]"),
        expect.anything()
      );
    });

    it("should handle missing data parameters", () => {
      logger.error("Error without data");
      logger.info("Info without data");

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[ERROR] Error without data",
        ""
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        "[INFO] Info without data",
        ""
      );
    });
  });
});
