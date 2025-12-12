import { z } from "zod";
import { removeGlif } from "../saved-glifs.js";
import {
  parseToolArguments,
  type ToolRequest,
} from "../utils/request-parsing.js";
import type { ToolResponse } from "./index.js";

export const schema = z.object({
  toolName: z.string(),
});

export const definition = {
  name: "remove_glif_tool",
  description:
    "Remove a saved workflow tool by its tool name. Use list_saved_glif_tools to see available tools.",
  inputSchema: {
    type: "object",
    properties: {
      toolName: {
        type: "string",
        description: "The tool name of the saved workflow to remove",
      },
    },
    required: ["toolName"],
  },
  annotations: {
    title: "Remove Saved Tool",
    readOnlyHint: false,
    destructiveHint: true,
  },
};

export async function handler(request: ToolRequest): Promise<ToolResponse> {
  const args = parseToolArguments(request, schema);
  const removed = await removeGlif(args.toolName);

  return {
    content: [
      {
        type: "text",
        text: removed
          ? `Successfully removed tool "${args.toolName}"`
          : `Tool "${args.toolName}" not found`,
      },
    ],
  };
}
