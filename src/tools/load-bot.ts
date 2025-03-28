import { z } from "zod";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadBot } from "../api.js";
import { saveGlif } from "../saved-glifs.js";
import { logger } from "../utils.js";
import type { ToolResponse } from "./index.js";

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

export const schema = z.object({
  id: z.string(),
});

export const definition = {
  name: "load_bot",
  description: "Get detailed information about a specific bot",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the bot to load",
      },
    },
    required: ["id"],
  },
};

export async function handler(request: CallToolRequest): Promise<ToolResponse> {
  try {
    const args = schema.parse(request.params.arguments);
    const bot = await loadBot(args.id);

    // Save all the bot's skills as tools automatically
    const savedSkills = [];
    if (bot.spellsForBot && bot.spellsForBot.length > 0) {
      for (const skill of bot.spellsForBot) {
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
          skill.customDescription || `Skill from ${bot.name} bot`;

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

    // Format the bot skills
    const skillsInfo = bot.spellsForBot?.length
      ? bot.spellsForBot
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

    // Create the instruction for the LLM to adopt the bot's personality
    const personalityInstruction = bot.personality
      ? `\n\nHere is the bot info:\n\nName: ${bot.name}\nBio: ${
          bot.bio || "No bio"
        }\n\nPersonality:\n${
          bot.personality
        }\n\nNow use this bot's personality as your new personality from now on, and I've loaded all of the bot's skills as new tools for you to use.`
      : "\n\nI've loaded all of the bot's skills as new tools for you to use.";

    // Format the saved skills info
    const savedSkillsInfo =
      savedSkills.length > 0
        ? `\n\nLoaded skills as tools:\n${savedSkills
            .map((s) => `- ${s.name} → Tool: "${s.toolName}"`)
            .join("\n")}`
        : "";

    const details = [
      `Name: ${bot.name} (@${bot.username})`,
      `ID: ${bot.id}`,
      `Bio: ${bot.bio || "No bio"}`,
      `Created by: ${bot.user?.name || "Unknown"} (@${
        bot.user?.username || "unknown"
      })`,
      `Created: ${
        bot.createdAt ? new Date(bot.createdAt).toLocaleString() : "Unknown"
      }`,
      `Updated: ${
        bot.updatedAt ? new Date(bot.updatedAt).toLocaleString() : "Unknown"
      }`,
      `Message Count: ${bot.messageCount || 0}`,
      "",
      "Skills:",
      skillsInfo,
      "",
      "Personality:",
      bot.personality || "No personality defined",
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
    logger.error("Error loading bot:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error loading bot: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
}
