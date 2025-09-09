import { z } from "zod";
import { removeAllGlifs } from "../saved-glifs.js";
import { logger } from "../utils/utils.js";
import type { ToolResponse } from "./index.js";

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

export async function handler(): Promise<ToolResponse> {
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
