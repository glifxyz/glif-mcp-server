import { z } from "zod";
import { listBots } from "../api.js";
import {
  parseToolArguments,
  type ToolRequest,
} from "../utils/request-parsing.js";
import { logger } from "../utils/utils.js";
import type { ToolResponse } from "./index.js";

export const schema = z.object({
  sort: z.enum(["new", "popular", "featured"]).optional(),
  username: z.string().optional(),
  searchQuery: z.string().optional(),
});

export const definition = {
  name: "list_agents",
  description:
    "Get a list of agents (also known as bots or sim templates) with optional filtering and sorting. Supports sort={new,popular,featured} (defaults to featured), username filtering, and text search.",
  inputSchema: {
    type: "object",
    properties: {
      sort: {
        type: "string",
        enum: ["new", "popular", "featured"],
        description: "Optional sort order for agents (defaults to featured)",
      },
      username: {
        type: "string",
        description: "Optional filter for agents by creator username",
      },
      searchQuery: {
        type: "string",
        description:
          "Optional search query to filter agents by name or description",
      },
    },
    required: [],
  },
  annotations: {
    title: "List Agents",
    readOnlyHint: true,
  },
};

export async function handler(request: ToolRequest): Promise<ToolResponse> {
  try {
    const args = parseToolArguments(request, schema);

    const params: {
      sort?: "new" | "popular" | "featured";
      creator?: string;
      searchQuery?: string;
    } = {};

    if (args.sort) params.sort = args.sort;
    if (args.username) params.creator = args.username;
    if (args.searchQuery) params.searchQuery = args.searchQuery;

    const agents = await listBots(params);

    const formattedAgents = agents
      .map((agent) => {
        const skills =
          agent.spellsForBot && agent.spellsForBot.length > 0
            ? `\nSkills: ${agent.spellsForBot
                .map((s) => s.spell?.name || "Unknown Skill")
                .join(", ")}`
            : "";

        return `${agent.name} (@${agent.username}) - ID: ${agent.id}
Bio: ${agent.bio || "No bio"}
Created by: ${agent.user?.name || "Unknown"} (@${agent.user?.username || "unknown"})
Messages: ${agent.messageCount || 0}${skills}\n`;
      })
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Available agents:\n\n${formattedAgents}`,
        },
      ],
    };
  } catch (error) {
    logger.error("Error listing agents:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error listing agents: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
}
