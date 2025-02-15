import { z } from "zod";
import {
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  formatOutput,
  getGlifDetails,
  runGlif,
  searchGlifs,
  getMyGlifs,
  createGlif,
} from "./api.js";
import { SearchParamsSchema } from "./types.js";

const RunGlifArgsSchema = z.object({
  id: z.string(),
  inputs: z.array(z.string()),
});

const ShowGlifArgsSchema = z.object({
  id: z.string(),
});

const GetMyGlifsArgsSchema = z.object({
  userId: z.string(),
});

const CreateGlifArgsSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export function setupToolHandlers(server: Server) {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case "run_glif": {
        const args = RunGlifArgsSchema.parse(request.params.arguments);
        const result = await runGlif(args.id, args.inputs);

        return {
          content: [
            {
              type: "text",
              text: formatOutput(result.outputFull.type, result.output),
            },
          ],
        };
      }

      case "list_featured_glifs": {
        const glifs = await searchGlifs({ featured: true });
        const formattedGlifs = glifs
          .map(
            (glif) =>
              `${glif.name} (${glif.id})\n${glif.description}\nBy: ${glif.user.name}\nRuns: ${glif.completedSpellRunCount}\n`
          )
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Featured glifs:\n\n${formattedGlifs}`,
            },
          ],
        };
      }

      case "search_glifs": {
        const args = z
          .object({ query: z.string() })
          .parse(request.params.arguments);
        const glifs = await searchGlifs({ q: args.query });
        const formattedGlifs = glifs
          .map(
            (glif) =>
              `${glif.name} (${glif.id})\n${glif.description}\nBy: ${glif.user.name}\nRuns: ${glif.completedSpellRunCount}\n`
          )
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Search results for "${args.query}":\n\n${formattedGlifs}`,
            },
          ],
        };
      }

      case "glif_info": {
        const args = ShowGlifArgsSchema.parse(request.params.arguments);
        const { glif, recentRuns } = await getGlifDetails(args.id);

        // Extract input field names from glif data
        const inputFields =
          glif.data?.nodes
            ?.filter((node) => node.type.includes("input"))
            .map((node) => ({
              name: node.name,
              type: node.type,
              params: node.params,
            })) ?? [];

        const details = [
          `Name: ${glif.name}`,
          `Description: ${glif.description}`,
          `Created by: ${glif.user.name} (@${glif.user.username})`,
          `Created: ${new Date(glif.createdAt).toLocaleString()}`,
          `Runs: ${glif.completedSpellRunCount}`,
          `Average Duration: ${glif.averageDuration}ms`,
          `Likes: ${glif.likeCount}`,
          "",
          "Input Fields:",
          ...inputFields.map((field) => `- ${field.name} (${field.type})`),
          "",
          "Recent Runs:",
          ...recentRuns.map(
            (run) =>
              `Time: ${new Date(run.createdAt).toLocaleString()}
  Duration: ${run.totalDuration}ms
  Output: ${formatOutput(run.outputType, run.output)}
  By: ${run.user.name} (@${run.user.username})
  ${Object.entries(run.inputs)
    .map(([key, value]) => `  Input "${key}": ${value}`)
    .join("\n")}`
          ),
        ];

        return {
          content: [
            {
              type: "text",
              text: details.join("\n"),
            },
          ],
        };
      }

      case "my_glifs": {
        const args = GetMyGlifsArgsSchema.parse(request.params.arguments);
        const glifs = await getMyGlifs(args.userId);
        const formattedGlifs = glifs
          .map(
            (glif) =>
              `${glif.name} (${glif.id})\n${
                glif.description
              }\nCreated: ${new Date(glif.createdAt).toLocaleString()}\nRuns: ${
                glif.completedSpellRunCount
              }\n`
          )
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Your glifs:\n\n${formattedGlifs}`,
            },
          ],
        };
      }

      case "create_glif": {
        const args = CreateGlifArgsSchema.parse(request.params.arguments);
        try {
          await createGlif(args.name, args.description);
          return {
            content: [
              {
                type: "text",
                text: "Coming soon!",
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: "Create glif functionality coming soon!",
              },
            ],
          };
        }
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
    }
  });
}

export const toolDefinitions = [
  {
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
  },
  {
    name: "list_featured_glifs",
    description: "Get a curated list of featured glifs",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "search_glifs",
    description: "Search for glifs by query string",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "glif_info",
    description: "Get detailed information about a glif including input fields",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The ID of the glif to show details for",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "my_glifs",
    description: "Get a list of glifs created by a specific user",
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The ID of the user whose glifs to fetch",
        },
      },
      required: ["userId"],
    },
  },
  // TODO: Endpoint not yet available
  // {
  //   name: "my_liked_glifs",
  //   description: "Get a list of glifs liked by a specific user",
  //   inputSchema: {
  //     type: "object",
  //     properties: {
  //       userId: {
  //         type: "string",
  //         description: "The ID of the user whose liked glifs to fetch",
  //       },
  //     },
  //     required: ["userId"],
  //   },
  // },
  {
    name: "create_glif",
    description: "Create a new glif (Coming soon!)",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the glif to create",
        },
        description: {
          type: "string",
          description: "Description of the glif",
        },
      },
      required: ["name", "description"],
    },
  },
];
