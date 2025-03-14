import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
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
 * Format API output based on type
 */
export function formatOutput(type: string, output: string): string {
  switch (type) {
    case "IMAGE":
      return `[Image] ${output}`;
    case "VIDEO":
      return `[Video] ${output}`;
    case "AUDIO":
      return `[Audio] ${output}`;
    default:
      return output;
  }
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
