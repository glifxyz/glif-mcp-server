import { z } from "zod";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getMyUserInfo, getMyGlifs, getMyRecentRuns } from "../api.js";
import { formatOutput } from "../utils.js";
import type { ToolResponse } from "./index.js";

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

export const schema = z.object({});

export const definition = {
  name: "my_glif_user_info",
  description:
    "Get detailed information about your user account, recent glifs, and recent runs",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function handler(request: CallToolRequest): Promise<ToolResponse> {
  const [user, glifs, recentRuns] = await Promise.all([
    getMyUserInfo(),
    getMyGlifs(),
    getMyRecentRuns(),
  ]);

  const details = [
    "User Information:",
    `ID: ${user.id}`,
    `Name: ${user.name}`,
    `Username: ${user.username}`,
    `Image: ${user.image}`,
    user.bio ? `Bio: ${user.bio}` : null,
    user.website ? `Website: ${user.website}` : null,
    user.location ? `Location: ${user.location}` : null,
    `Staff: ${user.staff ? "Yes" : "No"}`,
    `Subscriber: ${user.isSubscriber ? "Yes" : "No"}`,
    "",
    "Your Recent Glifs:",
    ...glifs
      .slice(0, 5)
      .map(
        (glif) =>
          `- ${glif.name} (${glif.id})\n  Created: ${new Date(
            glif.createdAt
          ).toLocaleString()}\n  Runs: ${glif.completedSpellRunCount}`
      ),
    "",
    "Your Recent Runs:",
    ...recentRuns
      .slice(0, 5)
      .map(
        (run) =>
          `- ${run.spell.name}\n  Time: ${new Date(
            run.createdAt
          ).toLocaleString()}\n  Duration: ${run.totalDuration}ms\n  Output: ${
            run.output
              ? formatOutput(run.outputType ?? "TEXT", run.output)
              : "No output"
          }`
      ),
  ].filter(Boolean);

  return {
    content: [
      {
        type: "text",
        text: details.join("\n"),
      },
    ],
  };
}
