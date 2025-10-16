import { z } from "zod";
import { getMyGlifs } from "../api.js";
import type { ToolResponse } from "./index.js";

export const schema = z.object({});

export const definition = {
  name: "my_glifs",
  description: "Get a list of your glifs",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  annotations: {
    title: "My Glifs",
    readOnlyHint: true,
  },
};

export async function handler(): Promise<ToolResponse> {
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
