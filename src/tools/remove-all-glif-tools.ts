import { z } from "zod";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { removeAllGlifs } from "../saved-glifs.js";
import { logger } from "../utils.js";
import type { ToolResponse } from "./index.js";

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

export const schema = z.object({});

export const definition = {
  name: "remove_all_glif_tools",
  description: "Remove all saved glif tools and return to a pristine state",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function handler(request: CallToolRequest): Promise<ToolResponse> {
  try {
    const count = await removeAllGlifs();
    return {
      content: [
        {
          type: "text",
          text: `Successfully removed all ${count} saved glif tools.`,
        },
      ],
    };
  } catch (error) {
    logger.error("Error removing all glif tools:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error removing all glif tools: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
}
