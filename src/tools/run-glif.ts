import { z } from "zod";
import { runGlif } from "../api.js";
import {
  createContentBlocks,
  createStructuredContent,
  truncateBase64InContentBlocks,
} from "../utils/content-blocks.js";
import {
  parseToolArguments,
  type ToolRequest,
} from "../utils/request-parsing.js";
import { logger } from "../utils/utils.js";
import type { ToolResponse } from "./index.js";

export const schema = z.object({
  id: z.string(),
  inputs: z.array(z.string()),
});

export const definition = {
  name: "run_workflow",
  description:
    "Run a workflow (glif) with the specified ID and inputs. Workflows can generate images, text, audio, and more. Inputs can include text, URLs, or base64-encoded media.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the workflow (glif) to run",
      },
      inputs: {
        type: "array",
        items: {
          type: "string",
        },
        description:
          "Array of input values. Can be text, media URLs, or base64-encoded media (data:image/png;base64,... or data:image/jpeg;base64,...)",
      },
    },
    required: ["id", "inputs"],
  },
  annotations: {
    title: "Run Workflow",
    readOnlyHint: false,
    destructiveHint: false,
  },
};

export async function handler(request: ToolRequest): Promise<ToolResponse> {
  const args = parseToolArguments(request, schema);
  logger.debug("run-glif handler called", {
    id: args.id,
    inputsLength: args.inputs.length,
  });

  const result = await runGlif(args.id, args.inputs);
  logger.debug("runGlif result", {
    output: `${result.output?.slice(0, 100)}...`,
    outputFull: result.outputFull,
  });

  // Create MCP-compliant content blocks with multimedia support
  const content = await createContentBlocks(result.output, result.outputFull);
  logger.debug(
    "createContentBlocks result",
    truncateBase64InContentBlocks(content)
  );

  // Create structured content for JSON outputs if applicable
  const structuredContent = createStructuredContent(
    result.output,
    result.outputFull
  );
  logger.debug("structuredContent", structuredContent);

  const response = {
    content,
    ...(structuredContent && { structuredContent }),
  };
  logger.debug("final response", {
    ...response,
    content: truncateBase64InContentBlocks(response.content),
  });

  return response;
}
