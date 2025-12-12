import { z } from "zod";
import { loadBot } from "../api.js";
import { saveGlif } from "../saved-glifs.js";
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
    "Load an agent (also known as a bot) and automatically save its skills as tools. Returns the agent's personality and details.",
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
    readOnlyHint: false,
    destructiveHint: false,
  },
};

export async function handler(request: ToolRequest): Promise<ToolResponse> {
  try {
    const args = parseToolArguments(request, schema);
    const agent = await loadBot(args.id);

    // Save all the agent's skills as tools automatically
    const savedSkills = [];
    if (agent.spellsForBot && agent.spellsForBot.length > 0) {
      for (const skill of agent.spellsForBot) {
        const skillName = skill.spell?.name || "Unknown Skill";
        const spellId = skill.spell?.id || `unknown-${Date.now()}`;

        // Sanitize the tool name
        const toolName = `${skillName
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_-]/g, "")
          .toLowerCase()}`
          .substring(0, 64)
          .replace(/_+$/, "");

        const description =
          skill.customDescription || `Skill from ${agent.name} agent`;

        const savedGlif = {
          id: spellId,
          toolName,
          name: skill.customName || skillName,
          description,
          createdAt: new Date().toISOString(),
        };

        await saveGlif(savedGlif);
        savedSkills.push({
          name: skillName,
          toolName,
        });
      }
    }

    // Format the agent skills
    const skillsInfo = agent.spellsForBot?.length
      ? agent.spellsForBot
          .map((skill) => {
            const spellName = skill.spell?.name || "Unknown Skill";
            const spellId = skill.spell?.id || "unknown";
            return `- ${spellName}${
              skill.customName ? ` (${skill.customName})` : ""
            }
Description: ${skill.customDescription || "No description"}
Glif ID: ${spellId}
${skill.usageInstructions ? `Usage: ${skill.usageInstructions}` : ""}`;
          })
          .join("\n\n")
      : "No skills available";

    // Create the instruction for the LLM to adopt the agent's personality
    const personalityInstruction = agent.personality
      ? `\n\nHere is the agent info:\n\nName: ${agent.name}\nBio: ${
          agent.bio || "No bio"
        }\n\nPersonality:\n${
          agent.personality
        }\n\nNow use this agent's personality as your new personality from now on, and I've loaded all of the agent's skills as new tools for you to use.`
      : "\n\nI've loaded all of the agent's skills as new tools for you to use.";

    // Format the saved skills info
    const savedSkillsInfo =
      savedSkills.length > 0
        ? `\n\nLoaded skills as tools:\n${savedSkills
            .map((s) => `- ${s.name} → Tool: "${s.toolName}"`)
            .join("\n")}`
        : "";

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
      `Updated: ${
        agent.updatedAt ? new Date(agent.updatedAt).toLocaleString() : "Unknown"
      }`,
      `Message Count: ${agent.messageCount || 0}`,
      "",
      "Skills:",
      skillsInfo,
      "",
      "Personality:",
      agent.personality || "No personality defined",
      personalityInstruction,
      savedSkillsInfo,
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
