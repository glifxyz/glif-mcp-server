import { z } from "zod";
import {
  parseToolArguments,
  type ToolRequest,
} from "../utils/request-parsing.js";
import { listBots } from "../api.js";
import { logger } from "../utils/utils.js";
import type { ToolResponse } from "./index.js";

export const schema = z.object({
  sort: z.enum(["new", "popular", "featured"]).optional(),
  username: z.string().optional(),
  searchQuery: z.string().optional(),
});

export const definition = {
  name: "list_bots",
  description:
    "Get a list of bots and sim templates with optional filtering and sorting. Supports sort={new,popular,featured} (defaults to popular), username filtering, and text search.",
  inputSchema: {
    type: "object",
    properties: {
      sort: {
        type: "string",
        enum: ["new", "popular", "featured"],
        description: "Optional sort order for bots (defaults to featured)",
      },
      username: {
        type: "string",
        description: "Optional filter for bots by creator username",
      },
      searchQuery: {
        type: "string",
        description:
          "Optional search query to filter bots by name or description",
      },
    },
    required: [],
  },
};

export async function handler(request: ToolRequest): Promise<ToolResponse> {
  try {
    const args = parseToolArguments(request, schema);

    const bots = await listBots({
      sort: args.sort,
      creator: args.username,
      searchQuery: args.searchQuery,
    });

    // Format the bot list
    const formattedBots = bots
      .map((bot) => {
        const skills =
          bot.spellsForBot && bot.spellsForBot.length > 0
            ? `\nSkills: ${bot.spellsForBot
                .map((s) => s.spell?.name || "Unknown Skill")
                .join(", ")}`
            : "";

        return `${bot.name} (@${bot.username}) - ID: ${bot.id}
Bio: ${bot.bio || "No bio"}
Created by: ${bot.user?.name || "Unknown"} (@${bot.user?.username || "unknown"})
Messages: ${bot.messageCount || 0}${skills}\n`;
      })
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Available bots:\n\n${formattedBots}`,
        },
      ],
    };
  } catch (error) {
    logger.error("Error listing bots:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error listing bots: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
}
