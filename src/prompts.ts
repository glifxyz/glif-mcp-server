import {
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { getGlifDetails, runGlif, searchGlifs } from "./api.js";
import { handleApiError, logger } from "./utils/utils.js";
import { createContentBlocks } from "./utils/content-blocks.js";
import type { ContentBlock } from "@modelcontextprotocol/sdk/types.js";

/**
 * Available prompts
 */
const PROMPTS = [
  {
    name: "showcase_featured_glif",
    description: "Show and run the most recent featured glif with fun inputs",
  },
];

/**
 * Format output for prompts (text-based with multimedia descriptions)
 */
async function formatPromptOutput(
  output: string,
  outputFull: { type: string; [key: string]: unknown }
): Promise<string> {
  const contentBlocks = await createContentBlocks(output, outputFull);

  // Convert content blocks to text for prompt display
  return contentBlocks
    .map((block: ContentBlock) => {
      switch (block.type) {
        case "text":
          return block.text;
        case "image":
          return `🖼️ **Image Generated**\n*MIME Type: ${
            block.mimeType
          }*\n*Data: ${block.data.slice(0, 50)}...*`;
        case "audio":
          return `🎧 **Audio Generated**\n*MIME Type: ${
            block.mimeType
          }*\n*Data: ${block.data.slice(0, 50)}...*`;
        default:
          return "[Unknown content type]";
      }
    })
    .join("\n\n");
}

/**
 * Generate fun inputs based on field labels/types
 */
function generateFunInput(field: {
  name: string;
  type: string;
  params: { label?: string | null | undefined } & Record<string, unknown>;
}): string {
  const label = (
    typeof field.params.label === "string" ? field.params.label : field.name
  ).toLowerCase();

  // Try to generate a fun input based on the label
  if (label.includes("name")) return "Captain Awesome";
  if (label.includes("animal")) return "Flying Rainbow Unicorn";
  if (label.includes("color")) return "Sparkly Galaxy Purple";
  if (label.includes("food")) return "Magic Pizza with Stardust Toppings";
  if (label.includes("place")) return "Cloud Castle in the Sky";
  if (label.includes("story"))
    return "Once upon a time in a digital wonderland...";

  // Default to something generally fun
  return "Something Magical ✨";
}

export function setupPromptHandlers(server: Server) {
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS,
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name !== "showcase_featured_glif") {
      throw new McpError(ErrorCode.InvalidRequest, "Unknown prompt");
    }

    try {
      // Get featured glifs
      const glifs = await searchGlifs({ featured: true });
      logger.debug("showcase_featured_glif - found glifs", {
        count: glifs.length,
      });

      // Sort by featuredAt and get most recent
      const mostRecent = glifs
        .filter((g) => g.featuredAt)
        .sort(
          (a, b) =>
            new Date(b.featuredAt!).getTime() -
            new Date(a.featuredAt!).getTime()
        )[0];

      if (!mostRecent) {
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: "No featured glifs found.",
              },
            },
          ],
        };
      }

      // Get detailed info including input fields
      const { glif } = await getGlifDetails(mostRecent.id);

      // Extract input fields and generate fun inputs based on field names/types
      const inputFields =
        glif.data?.nodes
          ?.filter((node) => node.type.includes("input"))
          .map((node) => ({
            name: node.name,
            type: node.type,
            params: node.params,
          })) ?? [];

      // Generate fun inputs based on field labels/types
      const funInputs = inputFields.map(generateFunInput);

      // Run the glif with fun inputs
      const result = await runGlif(glif.id, funInputs);

      const messages = [
        {
          role: "user",
          content: {
            type: "text",
            text: `I found this awesome featured glif!\n\nName: ${
              glif.name
            }\nDescription: ${glif.description}\nBy: ${glif.user.name} (@${
              glif.user.username
            })\nFeatured: ${new Date(
              glif.featuredAt!
            ).toLocaleString()}\n\nIt takes these inputs:\n${inputFields
              .map((f, i) => `${f.params.label ?? f.name}: "${funInputs[i]}"`)
              .join("\n")}\n\nHere's what it created:\n${
              result.output !== null && result.outputFull
                ? await formatPromptOutput(result.output, result.outputFull)
                : "No output received"
            }`,
          },
        },
      ];

      return {
        messages,
      };
    } catch (error: unknown) {
      return handleApiError(error, "showcase_featured_glif prompt");
    }
  });
}
