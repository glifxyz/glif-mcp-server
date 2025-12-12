import { z } from "zod";
import { getGlifDetails } from "../api.js";
import { saveGlif } from "../saved-glifs.js";
import {
  parseToolArguments,
  type ToolRequest,
} from "../utils/request-parsing.js";
import type { ToolResponse } from "./index.js";

export const schema = z.object({
  id: z.string(),
  toolName: z
    .string()
    .regex(
      /^[a-zA-Z0-9_-]{1,64}$/,
      "Tool name must only contain alphanumeric characters, underscores, and hyphens, and be 1-64 characters long"
    ),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const definition = {
  name: "save_glif_as_tool",
  description:
    "Save a workflow (glif) as a custom tool for quick access. The workflow becomes callable by its tool name.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the workflow (glif) to save",
      },
      toolName: {
        type: "string",
        description: "The name to use for the tool (must be unique)",
      },
      name: {
        type: "string",
        description:
          "Optional custom name for the tool (defaults to workflow name)",
      },
      description: {
        type: "string",
        description:
          "Optional custom description (defaults to workflow description)",
      },
    },
    required: ["id", "toolName"],
  },
  annotations: {
    title: "Save Workflow as Tool",
    readOnlyHint: false,
    destructiveHint: false,
  },
};

export async function handler(request: ToolRequest): Promise<ToolResponse> {
  const args = parseToolArguments(request, schema);

  // Get glif details to use name/description if not provided
  const { glif } = await getGlifDetails(args.id);

  const savedGlif = {
    id: args.id,
    toolName: args.toolName,
    name: args.name || glif.name,
    description: args.description || glif.description || "",
    createdAt: new Date().toISOString(),
  };

  await saveGlif(savedGlif);

  return {
    content: [
      {
        type: "text",
        text: `Successfully saved workflow "${savedGlif.name}" as tool "${savedGlif.toolName}"`,
      },
    ],
  };
}
