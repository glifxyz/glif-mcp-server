import { z } from "zod";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getSavedGlifs } from "../saved-glifs.js";
import { logger } from "../utils.js";
import type { ToolResponse } from "./index.js";

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

export const schema = z.object({});

export const definition = {
  name: "list_saved_glif_tools",
  description: "List all saved glif tools",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function handler(request: CallToolRequest): Promise<ToolResponse> {
  const savedGlifs = await getSavedGlifs();

  // Ensure savedGlifs is a valid array with content
  if (!Array.isArray(savedGlifs) || savedGlifs.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "No saved glif tools found.",
        },
      ],
    };
  }

  try {
    const formattedGlifs = savedGlifs
      .map((glif) => {
        // Ensure we have valid date string for createdAt
        let dateStr = "Unknown date";
        try {
          dateStr = new Date(glif.createdAt).toLocaleString();
        } catch (err) {
          // Use fallback if date is invalid
        }

        return `${glif.name} (tool: ${glif.toolName})\n${glif.description}\nOriginal Glif ID: ${glif.id}\nSaved: ${dateStr}\n`;
      })
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Saved glif tools:\n\n${formattedGlifs}`,
        },
      ],
    };
  } catch (error) {
    logger.error("Error formatting saved glifs:", error);
    // Return a fallback response with the raw data
    return {
      content: [
        {
          type: "text",
          text: `Saved glif tools:\n\n${JSON.stringify(savedGlifs, null, 2)}`,
        },
      ],
    };
  }
}
