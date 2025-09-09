import {
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import type { WretchError } from "wretch";
import { z } from "zod";

/**
 * Standardized logging utility with different log levels
 * Don't push to stdout; that's used for actual server output
 */
export const logger = {
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error ? error : "");
  },
  info: (message: string, data?: unknown) => {
    console.error(`[INFO] ${message}`, data ? data : "");
  },
  debug: (message: string, data?: unknown) => {
    if (process.env.DEBUG) {
      console.error(`[DEBUG] ${message}`, data ? data : "");
    }
  },
};

/**
 * Format API output based on type (legacy text-only function)
 * @deprecated Use createContentBlocks instead for multimedia support
 */
export function formatOutput(type: string, output: string): string {
  switch (type) {
    case "IMAGE":
      return `[Image] ${output} ![](${output})`;
    case "VIDEO":
      return `[Video] ${output}`;
    case "AUDIO":
      return `[Audio] ${output}`;
    default:
      return output;
  }
}

/**
 * Convert a URL to base64 data for MCP content blocks
 */
export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return base64;
  } catch (error) {
    logger.error(`Failed to convert URL to base64: ${url}`, error);
    throw error;
  }
}

/**
 * Get MIME type from URL or file extension
 */
export function getMimeType(url: string): string {
  const extension = url.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "m4a":
      return "audio/mp4";
    default:
      return "application/octet-stream";
  }
}

/**
 * Check if a URL points to an image
 */
export function isImageUrl(url: string): boolean {
  const mimeType = getMimeType(url);
  return mimeType.startsWith("image/");
}

/**
 * Check if a URL points to audio
 */
export function isAudioUrl(url: string): boolean {
  const mimeType = getMimeType(url);
  return mimeType.startsWith("audio/");
}

/**
 * Check if a URL points to video
 */
export function isVideoUrl(url: string): boolean {
  const mimeType = getMimeType(url);
  return mimeType.startsWith("video/");
}


/**
 * Standard error handler for API requests
 */
export function handleApiError(error: unknown, context: string): never {
  if (error instanceof McpError) {
    throw error;
  }

  logger.error(`handleApiError, ${context}:`, error);

  throw new McpError(
    ErrorCode.InternalError,
    `API error: ${error instanceof Error ? error.message : String(error)}`
  );
}

/**
 * Standard unauthorized error handler for wretch requests
 */
export function handleUnauthorized(err: WretchError): never {
  logger.error("Unauthorized request:", err);
  throw new McpError(ErrorCode.InternalError, `Unauthorized: ${err.message}`);
}

/**
 * Safely parse JSON with a fallback value
 */
export function safeJsonParse<T>(data: string, fallback: T): T {
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

/**
 * Validate data with a Zod schema and handle errors consistently
 */
export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    logger.error(`Validation error in ${context}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Data validation error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
