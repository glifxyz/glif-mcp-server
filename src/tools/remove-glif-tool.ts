import { z } from "zod";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { removeGlif } from "../saved-glifs.js";
import type { ToolResponse } from "./index.js";

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

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
};

export async function handler(request: CallToolRequest): Promise<ToolResponse> {
  const args = schema.parse(request.params.arguments);
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
