import { z } from "zod";
import {
  parseToolArguments,
  type ToolRequest,
} from "../utils/request-parsing.js";
import { runGlif } from "../api.js";
import {
  createContentBlocks,
  createStructuredContent,
} from "../utils/utils.js";
import type { ToolResponse } from "./index.js";

export const schema = z.object({
  id: z.string(),
  inputs: z.array(z.string()),
});

export const definition = {
  name: "run_glif",
  description: "Run a glif with the specified ID and inputs",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the glif to run",
      },
      inputs: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of input values for the glif",
      },
    },
    required: ["id", "inputs"],
  },
};

export async function handler(request: ToolRequest): Promise<ToolResponse> {
  const args = parseToolArguments(request, schema);
  const result = await runGlif(args.id, args.inputs);

  // Create MCP-compliant content blocks with multimedia support
  const content = await createContentBlocks(result.output, result.outputFull);

  // Create structured content for JSON outputs if applicable
  const structuredContent = createStructuredContent(result.output, result.outputFull);

  return {
    content,
    ...(structuredContent && { structuredContent }),
  };
}
