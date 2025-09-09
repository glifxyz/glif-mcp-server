import type { ContentBlock } from "@modelcontextprotocol/sdk/types.js";
import {
  getMimeType,
  isImageUrl,
  isAudioUrl,
  isVideoUrl,
  urlToBase64,
} from "./utils.js";

/**
 * Type for glif output metadata with better type safety
 */
export interface GlifOutputMetadata {
  type: "IMAGE" | "AUDIO" | "VIDEO" | "JSON" | "HTML" | "TEXT" | string;
  [key: string]: unknown;
}

/**
 * Truncate base64 data in content blocks for cleaner logging
 */
export function truncateBase64InContentBlocks(
  blocks: ContentBlock[]
): ContentBlock[] {
  return blocks.map((block) => {
    if ((block.type === "image" || block.type === "audio") && "data" in block) {
      return {
        ...block,
        data: block.data ? "[base64_encoded_data_hidden]" : block.data,
      };
    }
    return block;
  });
}

/**
 * Create content blocks for multimedia URLs with multiple format support
 */
async function createMultimediaBlocks(
  output: string,
  mediaType: "image" | "audio" | "video",
  emoji?: string
): Promise<ContentBlock[]> {
  const blocks: ContentBlock[] = [];
  const mimeType = getMimeType(output);
  const capitalizedType =
    mediaType.charAt(0).toUpperCase() + mediaType.slice(1);

  console.error(`[DEBUG] Adding multiple formats for ${mediaType}...`);

  // 1. Resource link for MCP-compliant clients
  blocks.push({
    type: "resource",
    resource: {
      uri: output,
      text: `Generated ${mediaType}: ${output}`,
      mimeType,
    },
  });

  // 2. Base64 embedded content for immediate display/playback (images and audio only)
  if (mediaType === "image" || mediaType === "audio") {
    try {
      console.error(`[DEBUG] Converting ${mediaType} to base64...`);
      const base64Data = await urlToBase64(output);
      blocks.push({
        type: mediaType,
        data: base64Data,
        mimeType,
      } as ContentBlock);
      console.error(`[DEBUG] Successfully added base64 ${mediaType}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[DEBUG] Failed to convert ${mediaType} to base64:`, {
        error: errorMsg,
        url: output,
        mediaType,
      });

      // Log specific error types for monitoring
      if (errorMsg.includes("timeout")) {
        console.error(
          `[WARNING] Network timeout for ${mediaType} URL: ${output}`
        );
      } else if (errorMsg.includes("too large")) {
        console.error(
          `[WARNING] File size exceeded for ${mediaType} URL: ${output}`
        );
      } else if (errorMsg.includes("Private/local IP")) {
        console.error(
          `[SECURITY] SSRF attempt blocked for ${mediaType} URL: ${output}`
        );
      }
    }
  }

  // 3. Text format for maximum compatibility
  const textContent =
    mediaType === "image"
      ? `![Generated ${capitalizedType}](${output})`
      : `${emoji || "📄"} ${capitalizedType}: ${output}`;

  blocks.push({
    type: "text",
    text: textContent,
  });

  return blocks;
}

/**
 * Create MCP-compliant content blocks from glif output
 */
export async function createContentBlocks(
  output: string | null,
  outputFull?: GlifOutputMetadata
): Promise<ContentBlock[]> {
  console.error("[DEBUG] createContentBlocks called with:", {
    output: output?.slice(0, 100) + "...",
    outputFull,
  });

  if (!output || !outputFull?.type) {
    console.error("[DEBUG] Early return: missing output or outputFull.type");
    return [{ type: "text", text: "No output received" }];
  }

  const blocks: ContentBlock[] = [];
  const type = outputFull.type.toUpperCase();
  console.error("[DEBUG] Processing type:", type);

  try {
    switch (type) {
      case "IMAGE":
        console.error(
          "[DEBUG] Processing IMAGE type, checking if isImageUrl:",
          {
            output,
            isImage: isImageUrl(output),
          }
        );
        if (isImageUrl(output)) {
          blocks.push(...(await createMultimediaBlocks(output, "image")));
        } else {
          console.error("[DEBUG] Not a valid image URL, using fallback");
          blocks.push({ type: "text", text: `[Image] ${output}` });
        }
        break;

      case "AUDIO":
        if (isAudioUrl(output)) {
          blocks.push(...(await createMultimediaBlocks(output, "audio", "🔊")));
        } else {
          blocks.push({ type: "text", text: `[Audio] ${output}` });
        }
        break;

      case "VIDEO":
        if (isVideoUrl(output)) {
          blocks.push(...(await createMultimediaBlocks(output, "video", "🎥")));
        } else {
          blocks.push({ type: "text", text: `[Video] ${output}` });
        }
        break;

      case "JSON":
        // For JSON, output raw data to preserve structure for LLM consumption
        // Don't wrap in code blocks as it pollutes the data
        blocks.push({ type: "text", text: output });
        break;

      case "HTML":
        // For HTML, output raw content to preserve structure for LLM consumption
        // Don't wrap in code blocks as it pollutes the data
        blocks.push({ type: "text", text: output });
        break;

      case "TEXT":
      default:
        blocks.push({ type: "text", text: output });
        break;
    }
  } catch (error) {
    console.error(`Error creating content blocks for ${type}:`, error);
    // Fallback to text output
    blocks.push({
      type: "text",
      text: `[${type}] ${output}\n\n⚠️ Error processing multimedia content: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }

  return blocks.length > 0 ? blocks : [{ type: "text", text: output }];
}

/**
 * Create structured content for JSON outputs using MCP's structuredContent field
 * This allows the LLM to receive structured data without formatting pollution
 */
export function createStructuredContent(
  output: string | null,
  outputFull?: GlifOutputMetadata
): Record<string, unknown> | null {
  // Only create structured content for JSON outputs
  if (outputFull?.type?.toUpperCase() === "JSON" && output) {
    try {
      const parsed = JSON.parse(output);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Invalid JSON, don't create structured content
    }
  }

  return null;
}
