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
  description: "Remove a saved glif tool",
  inputSchema: {
    type: "object",
    properties: {
      toolName: {
        type: "string",
        description: "The tool name of the saved glif to remove",
      },
    },
    required: ["toolName"],
  },
  annotations: {
    title: "Remove Glif Tool",
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
