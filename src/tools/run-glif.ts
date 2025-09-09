import { z } from "zod";
import {
  parseToolArguments,
  type ToolRequest,
} from "../utils/request-parsing.js";
import { runGlif } from "../api.js";
import { formatOutput } from "../utils/utils.js";
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

  // Handle case where outputFull might be undefined or output might be null
  if (!result.outputFull || result.output === null) {
    return {
      content: [
        {
          type: "text",
          text: "No output received from glif run",
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: formatOutput(result.outputFull.type, result.output),
      },
    ],
  };
}
