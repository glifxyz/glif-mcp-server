import { z } from "zod";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { searchGlifs } from "../api.js";
import type { ToolResponse } from "./index.js";

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

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

export async function handler(request: CallToolRequest): Promise<ToolResponse> {
  const args = schema.parse(request.params.arguments);
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
