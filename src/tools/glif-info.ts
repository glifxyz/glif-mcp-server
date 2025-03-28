import { z } from "zod";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getGlifDetails } from "../api.js";
import { formatOutput } from "../utils.js";
import type { ToolResponse } from "./index.js";

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

export const schema = z.object({
  id: z.string(),
});

export const definition = {
  name: "glif_info",
  description: "Get detailed information about a glif including input fields",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the glif to show details for",
      },
    },
    required: ["id"],
  },
};

export async function handler(request: CallToolRequest): Promise<ToolResponse> {
  const args = schema.parse(request.params.arguments);
  const { glif, recentRuns } = await getGlifDetails(args.id);

  // Extract input field names from glif data
  const inputFields =
    glif.data?.nodes
      ?.filter((node) => node.type.includes("input"))
      .map((node) => ({
        name: node.name,
        type: node.type,
        params: node.params,
      })) ?? [];

  const details = [
    `Name: ${glif.name}`,
    `Description: ${glif.description}`,
    `Created by: ${glif.user.name} (@${glif.user.username})`,
    `Created: ${new Date(glif.createdAt).toLocaleString()}`,
    `Runs: ${glif.completedSpellRunCount}`,
    `Average Duration: ${glif.averageDuration}ms`,
    `Likes: ${glif.likeCount}`,
    "",
    "Input Fields:",
    ...inputFields.map((field) => `- ${field.name} (${field.type})`),
    "",
    "Recent Runs:",
    ...recentRuns.map(
      (run) =>
        `Time: ${new Date(run.createdAt).toLocaleString()}
Duration: ${run.totalDuration}ms
Output: ${
          run.output
            ? formatOutput(run.outputType ?? "TEXT", run.output)
            : "No output"
        }
By: ${run.user.name} (@${run.user.username})
${
  run.inputs
    ? Object.entries(run.inputs)
        .map(([key, value]) => `  Input "${key}": ${value}`)
        .join("\n")
    : "No inputs"
}`
    ),
  ];

  return {
    content: [
      {
        type: "text",
        text: details.join("\n"),
      },
    ],
  };
}
