import { z } from "zod";
import {
  parseToolArguments,
  type ToolRequest,
} from "../utils/request-parsing.js";
import { searchGlifs } from "../api.js";
import type { ToolResponse } from "./index.js";

export const schema = z.object({
  query: z.string(),
});

export const definition = {
  name: "search_glifs",
  description: "Search for glifs by query string",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query string",
      },
    },
    required: ["query"],
  },
};

export async function handler(request: ToolRequest): Promise<ToolResponse> {
  const args = parseToolArguments(request, schema);
  const glifs = await searchGlifs({ q: args.query });
  const formattedGlifs = glifs
    .map(
      (glif) =>
        `${glif.name} (${glif.id})\n${glif.description}\nBy: ${glif.user.name}\nRuns: ${glif.completedSpellRunCount}\n`
    )
    .join("\n");

  return {
    content: [
      {
        type: "text",
        text: `Search results for "${args.query}":\n\n${formattedGlifs}`,
      },
    ],
  };
}
