import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { WretchError } from "wretch";
import type { z } from "zod";

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
 * Validate URL for security and protocol compliance
 */
function validateUrl(url: string): void {
  const allowedProtocols = ["http:", "https:"];
  const parsedUrl = new URL(url);

  if (!allowedProtocols.includes(parsedUrl.protocol)) {
    throw new Error(
      `Invalid protocol: ${parsedUrl.protocol}. Only HTTP/HTTPS allowed`
    );
  }

  // Check for private IP ranges to prevent SSRF
  const hostname = parsedUrl.hostname;
  const privateIpRegex =
    /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|localhost)/i;
  if (privateIpRegex.test(hostname) || hostname === "0.0.0.0") {
    throw new Error(`Private/local IP addresses not allowed: ${hostname}`);
  }
}

/**
 * Convert a URL to base64 data for MCP content blocks with security and performance safeguards
 */
export async function urlToBase64(url: string): Promise<string> {
  try {
    // Validate URL for security
    validateUrl(url);

    // Set up abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      logger.error(`Request timeout for URL: ${url}`);
    }, 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Range: "bytes=0-10485760", // 10MB limit
          "User-Agent": "glif-mcp-server/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content length
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > 10485760) {
        // 10MB
        throw new Error(`File too large: ${contentLength} bytes (max 10MB)`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // Final size check after download
      if (arrayBuffer.byteLength > 10485760) {
        throw new Error(
          `Downloaded file too large: ${arrayBuffer.byteLength} bytes (max 10MB)`
        );
      }

      const base64 = Buffer.from(arrayBuffer).toString("base64");
      logger.debug(
        `Successfully converted ${arrayBuffer.byteLength} bytes to base64`
      );
      return base64;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to convert URL to base64: ${url}`, {
      error: errorMsg,
    });
    throw new Error(`URL conversion failed: ${errorMsg}`);
  }
}

/**
 * Get MIME type from URL or file extension with validation
 * Note: This is a basic extension-based check and should not be relied upon for security
 */
export function getMimeType(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const extension = pathname.split(".").pop()?.toLowerCase();

    // Allowed MIME types for security
    const allowedMimeTypes: Record<string, string> = {
      // Images
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      // Video
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      // Audio
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
    };

    if (extension && allowedMimeTypes[extension]) {
      return allowedMimeTypes[extension];
    }

    logger.debug(
      `Unknown or unsupported file extension: ${extension} for URL: ${url}`
    );
    return "application/octet-stream";
  } catch (error) {
    logger.error(`Failed to parse URL for MIME type: ${url}`, error);
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
