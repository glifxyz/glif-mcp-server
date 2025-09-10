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
  prefix: z.string().optional(),
});

export const definition = {
  name: "save_bot_skills_as_tools",
  description: "Save all skills from a bot as individual tools",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the bot whose skills to save",
      },
      prefix: {
        type: "string",
        description: "Optional prefix to add to tool names (e.g., 'tshirt_')",
      },
    },
    required: ["id"],
  },
};

export async function handler(request: ToolRequest): Promise<ToolResponse> {
  try {
    const args = parseToolArguments(request, schema);
    const bot = await loadBot(args.id);

    if (!bot.spellsForBot || bot.spellsForBot.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `Bot "${bot.name}" has no skills to save.`,
          },
        ],
      };
    }

    const prefix = args.prefix || "";
    const savedSkills = [];

    // Save each skill as a tool
    for (const skill of bot.spellsForBot) {
      const skillName = skill.spell?.name || "Unknown Skill";
      const spellId = skill.spell?.id || `unknown-${Date.now()}`;

      // Sanitize the tool name to match the pattern ^[a-zA-Z0-9_-]{1,64}$
      const toolName = `${prefix}${skillName
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .toLowerCase()}`
        .substring(0, 64)
        .replace(/_+$/, ""); // Remove trailing underscores

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

    const formattedSkills = savedSkills
      .map((s) => `- ${s.name} → Tool: "${s.toolName}"`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Successfully saved ${savedSkills.length} skills from bot "${bot.name}" as tools:\n\n${formattedSkills}\n\nYou can now use these tools directly.`,
        },
      ],
    };
  } catch (error) {
    logger.error("Error saving bot skills:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error saving bot skills: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
}
