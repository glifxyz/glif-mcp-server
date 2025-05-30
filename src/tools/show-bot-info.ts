import { z } from "zod";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { ToolResponse } from "./index.js";
import { handler as loadBotHandler } from "./load-bot.js";

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

export const schema = z.object({
  id: z.string(),
});

export const definition = {
  name: "show_bot_info",
  description:
    "Get detailed information about a specific bot (alias for load_bot)",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the bot to show details for",
      },
    },
    required: ["id"],
  },
};

// Reuse the load_bot handler since this is just an alias
export const handler = loadBotHandler;
