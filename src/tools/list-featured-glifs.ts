import { z } from "zod";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { searchGlifs } from "../api.js";
import type { ToolResponse } from "./index.js";

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

export const schema = z.object({});

export const definition = {
  name: "list_featured_glifs",
  description: "Get a curated list of featured glifs",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function handler(request: CallToolRequest): Promise<ToolResponse> {
  const glifs = await searchGlifs({ featured: true });
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
        text: `Featured glifs:\n\n${formattedGlifs}`,
      },
    ],
  };
}
