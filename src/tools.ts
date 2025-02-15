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
  getMyUserInfo,
  getMyRecentRuns,
} from "./api.js";
import { SearchParamsSchema } from "./types.js";

const RunGlifArgsSchema = z.object({
  id: z.string(),
  inputs: z.array(z.string()),
});

const ShowGlifArgsSchema = z.object({
  id: z.string(),
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
  Output: ${
    run.output
      ? formatOutput(run.outputType ?? "TEXT", run.output)
      : "No output"
  }
  By: ${run.user.name} (@${run.user.username})
  ${
    run.inputs
      ? Object.entries(run.inputs)
          .map(([key, value]) => `  Input "${key}": ${value}`)
          .join("\n")
      : "No inputs"
  }`
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
        const glifs = await getMyGlifs();
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

      case "debug_me": {
        const [user, glifs, recentRuns] = await Promise.all([
          getMyUserInfo(),
          getMyGlifs(),
          getMyRecentRuns(),
        ]);

        const details = [
          "User Information:",
          `ID: ${user.id}`,
          `Name: ${user.name}`,
          `Username: ${user.username}`,
          `Image: ${user.image}`,
          user.bio ? `Bio: ${user.bio}` : null,
          user.website ? `Website: ${user.website}` : null,
          user.location ? `Location: ${user.location}` : null,
          `Staff: ${user.staff ? "Yes" : "No"}`,
          `Subscriber: ${user.isSubscriber ? "Yes" : "No"}`,
          "",
          "Your Recent Glifs:",
          ...glifs
            .slice(0, 5)
            .map(
              (glif) =>
                `- ${glif.name} (${glif.id})\n  Created: ${new Date(
                  glif.createdAt
                ).toLocaleString()}\n  Runs: ${glif.completedSpellRunCount}`
            ),
          "",
          "Your Recent Runs:",
          ...recentRuns
            .slice(0, 5)
            .map(
              (run) =>
                `- ${run.spell.name}\n  Time: ${new Date(
                  run.createdAt
                ).toLocaleString()}\n  Duration: ${
                  run.totalDuration
                }ms\n  Output: ${
                  run.output
                    ? formatOutput(run.outputType ?? "TEXT", run.output)
                    : "No output"
                }`
            ),
        ].filter(Boolean);

        return {
          content: [
            {
              type: "text",
              text: details.join("\n"),
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
    description: "Get a list of your glifs",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "debug_me",
    description:
      "Get detailed information about your user account, recent glifs, and recent runs",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
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
