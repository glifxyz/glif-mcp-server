import { z } from "zod";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getMyGlifs } from "../api.js";
import type { ToolResponse } from "./index.js";

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

export const schema = z.object({});

export const definition = {
  name: "my_glifs",
  description: "Get a list of your glifs",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function handler(request: CallToolRequest): Promise<ToolResponse> {
  const glifs = await getMyGlifs();
  const formattedGlifs = glifs
    .map(
      (glif) =>
        `${glif.name} (${glif.id})\n${glif.description}\nCreated: ${new Date(
          glif.createdAt
        ).toLocaleString()}\nRuns: ${glif.completedSpellRunCount}\n`
    )
    .join("\n");

  return {
    content: [
      {
        type: "text",
        text: `Your glifs:\n\n${formattedGlifs}`,
      },
    ],
  };
}
