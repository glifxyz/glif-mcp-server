import {
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import axios from "axios";
import { formatOutput, getGlifDetails, runGlif, searchGlifs } from "./api.js";

export function setupPromptHandlers(server: Server) {
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: "showcase_featured_glif",
        description:
          "Show and run the most recent featured glif with fun inputs",
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name !== "showcase_featured_glif") {
      throw new McpError(ErrorCode.InvalidRequest, "Unknown prompt");
    }

    try {
      // Get featured glifs
      const glifs = await searchGlifs({ featured: true });

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
      const { glif, recentRuns } = await getGlifDetails(mostRecent.id);

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
      const funInputs = inputFields.map((field) => {
        const label = (
          typeof field.params.label === "string"
            ? field.params.label
            : field.name
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
      });

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
              .join("\n")}\n\nHere's what it created:\n${formatOutput(
              result.outputFull.type,
              result.output
            )}`,
          },
        },
      ];

      return {
        messages,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `API error: ${error.response?.data?.message ?? error.message}`
        );
      }
      throw error;
    }
  });
}
