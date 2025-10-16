import { z } from "zod";
import { getMyGlifs, getMyRecentRuns, getMyUserInfo } from "../api.js";
import type { ToolResponse } from "./index.js";

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
  annotations: {
    title: "My Glif User Info",
    readOnlyHint: true,
  },
};

export async function handler(): Promise<ToolResponse> {
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
            run.output || "No output"
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
