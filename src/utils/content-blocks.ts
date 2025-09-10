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
 * Returns up to 3 content blocks: resource_link, base64 (if applicable), and text fallback
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
    type: "resource_link",
    uri: output,
    name: `Generated ${capitalizedType}`,
    mimeType,
  });

  // 2. Base64 embedded content for immediate display/playback (images and audio only)
  if (mediaType === "image" || mediaType === "audio") {
    try {
      console.error(`[DEBUG] Converting ${mediaType} to base64...`);
      const base64Data = await urlToBase64(output);
      if (mediaType === "image") {
        blocks.push({
          type: "image",
          data: base64Data,
          mimeType,
        });
      } else if (mediaType === "audio") {
        blocks.push({
          type: "audio",
          data: base64Data,
          mimeType,
        });
      }
      console.error(`[DEBUG] Successfully added base64 ${mediaType}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[DEBUG] Failed to convert ${mediaType} to base64:`, {
        error: errorMsg,
        url: output,
        mediaType,
      });

      // Log specific error types for monitoring and user feedback
      if (errorMsg.includes("timeout")) {
        console.error(
          `[WARNING] Network timeout for ${mediaType} URL: ${output}`
        );
      } else if (errorMsg.includes("too large")) {
        console.error(
          `[WARNING] File size exceeded (max 10MB) for ${mediaType} URL: ${output}`
        );
      } else if (errorMsg.includes("Private/local IP")) {
        console.error(
          `[SECURITY] SSRF attempt blocked for ${mediaType} URL: ${output}`
        );
      } else if (errorMsg.includes("HTTP")) {
        console.error(
          `[WARNING] HTTP error fetching ${mediaType} from: ${output}`
        );
      } else {
        console.error(
          `[WARNING] Unknown error fetching ${mediaType} from: ${output} - ${errorMsg}`
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
        // For JSON, provide both structured and text formats for maximum compatibility
        // Add resource_link if this appears to be an API endpoint or data resource
        if (output.startsWith("http")) {
          blocks.push({
            type: "resource_link",
            uri: output,
            name: "JSON Data",
            mimeType: "application/json",
          });
        }

        // Always include text format with raw JSON for LLM consumption
        blocks.push({ type: "text", text: output });
        break;

      case "HTML":
        // For HTML, provide rich content blocks for better client support
        // Add resource_link if this appears to be a web page URL
        if (output.startsWith("http")) {
          blocks.push({
            type: "resource_link",
            uri: output,
            name: "Web Page",
            mimeType: "text/html",
          });
        } else {
          // For HTML content, add resource_link with data URI for rich clients
          const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(
            output
          )}`;
          blocks.push({
            type: "resource_link",
            uri: dataUri,
            name: "Generated HTML",
            mimeType: "text/html",
          });
        }

        // Always include text format with raw HTML for LLM consumption
        blocks.push({ type: "text", text: output });
        break;

      case "TEXT":
      default:
        blocks.push({ type: "text", text: output });
        break;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Error creating content blocks for ${type}:`, {
      error: errorMsg,
      output: output?.slice(0, 100),
      type,
    });

    // Provide user-friendly fallback without exposing internal errors
    blocks.push({
      type: "text",
      text: `[${type}] ${output}\n\n⚠️ Could not process multimedia content. The URL may be inaccessible or the file format unsupported.`,
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
        // For arrays, wrap in an object to maintain MCP compatibility
        if (Array.isArray(parsed)) {
          return { data: parsed };
        }
        // Ensure we only return objects, not other types
        if (typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed;
        }
        return null;
      }
    } catch (parseError) {
      console.error("[DEBUG] Failed to parse JSON for structured content:", {
        error:
          parseError instanceof Error ? parseError.message : String(parseError),
        output: output.slice(0, 200),
      });
    }
  }

  return null;
}
