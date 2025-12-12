import { z } from "zod";
import { getMyGlifs } from "../api.js";
import type { ToolResponse } from "./index.js";

export const schema = z.object({});

export const definition = {
  name: "my_glifs",
  description:
    "Get a list of your published workflows (glifs). Shows your AI workflows with run counts and creation dates.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  annotations: {
    title: "My Workflows",
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
        text: `Your workflows:\n\n${formattedGlifs}`,
      },
    ],
  };
}
