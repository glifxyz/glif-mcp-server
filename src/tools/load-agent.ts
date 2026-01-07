import { z } from "zod";
import { loadBot } from "../api.js";
import {
  parseToolArguments,
  type ToolRequest,
} from "../utils/request-parsing.js";
import { logger } from "../utils/utils.js";
import type { ToolResponse } from "./index.js";

export const schema = z.object({
  id: z.string(),
});

export const definition = {
  name: "load_agent",
  description:
    "Load an agent and get its details including personality and workflows.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the agent to load",
      },
    },
    required: ["id"],
  },
  annotations: {
    title: "Load Agent",
    readOnlyHint: true,
  },
};

export async function handler(request: ToolRequest): Promise<ToolResponse> {
  try {
    const args = parseToolArguments(request, schema);
    const agent = await loadBot(args.id);

    // Format the agent workflows
    const workflowsInfo = agent.spellsForBot?.length
      ? agent.spellsForBot
          .map((workflow) => {
            const spellName = workflow.spell?.name || "Unknown Workflow";
            const spellId = workflow.spell?.id || "unknown";
            return `- ${spellName}${
              workflow.customName ? ` (${workflow.customName})` : ""
            }
  ID: ${spellId}
  Description: ${workflow.customDescription || "No description"}${
    workflow.usageInstructions ? `\n  Usage: ${workflow.usageInstructions}` : ""
  }`;
          })
          .join("\n\n")
      : "No workflows available";

    const details = [
      `Name: ${agent.name} (@${agent.username})`,
      `ID: ${agent.id}`,
      `Bio: ${agent.bio || "No bio"}`,
      `Created by: ${agent.user?.name || "Unknown"} (@${
        agent.user?.username || "unknown"
      })`,
      `Created: ${
        agent.createdAt ? new Date(agent.createdAt).toLocaleString() : "Unknown"
      }`,
      `Message Count: ${agent.messageCount || 0}`,
      "",
      "Workflows:",
      workflowsInfo,
      "",
      "Personality:",
      agent.personality || "No personality defined",
    ];

    return {
      content: [
        {
          type: "text",
          text: details.join("\n"),
        },
      ],
    };
  } catch (error) {
    logger.error("Error loading agent:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error loading agent: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
}
