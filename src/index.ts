#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { performance } from "node:perf_hooks";
import { z } from "zod";
import {
  GlifRunResponseSchema,
  GlifSchema,
  GlifRunSchema,
  SearchParamsSchema,
  UserSchema,
  type Glif,
  type GlifRun,
  type GlifRunResponse,
} from "./types.js";

const API_TOKEN = process.env.GLIF_API_TOKEN;
if (!API_TOKEN) {
  throw new Error("GLIF_API_TOKEN environment variable is required");
}

const axiosInstance = axios.create({
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

async function runGlif(id: string, inputs: string[]): Promise<GlifRunResponse> {
  // console.log(`Running glif ${id} with inputs:`, inputs);
  // const start = performance.now();

  try {
    const response = await axiosInstance.post("https://simple-api.glif.app", {
      id,
      inputs,
    });

    // const end = performance.now();
    // console.log(`Glif run completed in ${(end - start).toFixed(2)}ms`);

    return GlifRunResponseSchema.parse(response.data);
  } catch (error) {
    console.error("Error running glif:", error);
    throw error;
  }
}

async function searchGlifs(
  params: z.infer<typeof SearchParamsSchema>
): Promise<Glif[]> {
  // console.log("Searching glifs with params:", params);
  // const start = performance.now();

  try {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.set("q", params.q);
    if (params.featured) queryParams.set("featured", "1");
    if (params.id) queryParams.set("id", params.id);

    const url = `https://glif.app/api/glifs${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    const response = await axios.get(url);

    // const end = performance.now();
    // console.log(`Glif search completed in ${(end - start).toFixed(2)}ms`);

    return z.array(GlifSchema).parse(response.data);
  } catch (error) {
    console.error("Error searching glifs:", error);
    throw error;
  }
}

async function getGlifDetails(id: string): Promise<{
  glif: Glif;
  recentRuns: GlifRun[];
}> {
  // console.log(`Getting details for glif ${id}`);
  // const start = performance.now();

  try {
    const [glifResponse, runsResponse] = await Promise.all([
      axios.get(`https://glif.app/api/glifs?id=${id}`),
      axios.get(`https://glif.app/api/runs?glifId=${id}`),
    ]);

    const glif = z.array(GlifSchema).parse(glifResponse.data)[0];
    const recentRuns = z
      .array(GlifRunSchema)
      .parse(runsResponse.data)
      .slice(0, 3);

    // const end = performance.now();
    // console.log(`Glif details fetched in ${(end - start).toFixed(2)}ms`);
    return { glif, recentRuns };
  } catch (error) {
    console.error(
      "Error fetching glif details:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
}

const RunGlifArgsSchema = z.object({
  id: z.string(),
  inputs: z.array(z.string()),
});

const SearchGlifsArgsSchema = SearchParamsSchema;

const ShowGlifArgsSchema = z.object({
  id: z.string(),
});

function formatOutput(type: string, output: string): string {
  switch (type) {
    case "IMAGE":
      return `[Image] ${output}`;
    case "VIDEO":
      return `[Video] ${output}`;
    case "AUDIO":
      return `[Audio] ${output}`;
    default:
      return output;
  }
}

function formatGlifDetails(glif: Glif, recentRuns: GlifRun[]): string {
  const details = [
    `Name: ${glif.name}`,
    `Description: ${glif.description}`,
    `Created by: ${glif.user.name} (@${glif.user.username})`,
    `Created: ${new Date(glif.createdAt).toLocaleString()}`,
    `Runs: ${glif.completedSpellRunCount}`,
    `Average Duration: ${glif.averageDuration}ms`,
    `Likes: ${glif.likeCount}`,
    "",
    "Recent Runs:",
    ...recentRuns.map(
      (run) => `
  Time: ${new Date(run.createdAt).toLocaleString()}
  Duration: ${run.totalDuration}ms
  Output: ${formatOutput(run.outputType, run.output)}
  By: ${run.user.name} (@${run.user.username})
  ${Object.entries(run.inputs)
    .map(([key, value]) => `  Input "${key}": ${value}`)
    .join("\n")}
`
    ),
  ];

  return details.join("\n");
}

async function main() {
  const server = new Server(
    {
      name: "glif-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "glif://template",
        name: "Glif Details",
        description: "Get metadata about a specific glif",
        uriTemplate: "glif://{id}",
      },
      {
        uri: "glifRun://template",
        name: "Glif Run Details",
        description: "Get details about a specific glif run",
        uriTemplate: "glifRun://{id}",
      },
      {
        uri: "glifUser://template",
        name: "Glif User Details",
        description: "Get details about a glif user",
        uriTemplate: "glifUser://{id}",
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = new URL(request.params.uri);
    const id = uri.hostname;

    try {
      switch (uri.protocol) {
        case "glif:": {
          const { glif } = await getGlifDetails(id);
          return {
            contents: [
              {
                uri: request.params.uri,
                text: JSON.stringify(glif, null, 2),
              },
            ],
          };
        }
        case "glifRun:": {
          const response = await axios.get(
            `https://glif.app/api/runs?id=${id}`
          );
          const run = GlifRunSchema.parse(response.data[0]);
          return {
            contents: [
              {
                uri: request.params.uri,
                text: JSON.stringify(run, null, 2),
              },
            ],
          };
        }
        case "glifUser:": {
          const response = await axios.get(`https://glif.app/api/users/${id}`);
          const user = UserSchema.parse(response.data);
          return {
            contents: [
              {
                uri: request.params.uri,
                text: JSON.stringify(user, null, 2),
              },
            ],
          };
        }
        default:
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Unsupported protocol: ${uri.protocol}`
          );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `API error: ${error.response?.data?.message ?? error.message}`
        );
      }
      throw error;
    }
  });

  // Tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
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
        description:
          "Get detailed information about a glif including input fields",
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
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case "run_glif": {
        const args = RunGlifArgsSchema.parse(request.params.arguments);
        const result = await runGlif(args.id, args.inputs);

        // Format output based on type
        let formattedOutput = "";
        if (result.outputFull.type === "IMAGE") {
          formattedOutput = `[Image] ${result.output}`;
        } else if (result.outputFull.type === "VIDEO") {
          formattedOutput = `[Video] ${result.output}`;
        } else if (result.outputFull.type === "AUDIO") {
          formattedOutput = `[Audio] ${result.output}`;
        } else {
          formattedOutput = result.output;
        }

        return {
          content: [
            {
              type: "text",
              text: formattedOutput,
            },
          ],
        };
      }

      case "list_featured_glifs": {
        const response = await axios.get(
          "https://glif.app/api/glifs?featured=1"
        );
        const glifs = z.array(GlifSchema).parse(response.data);
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
        const response = await axios.get(
          `https://glif.app/api/glifs?q=${encodeURIComponent(args.query)}`
        );
        const glifs = z.array(GlifSchema).parse(response.data);
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

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
    }
  });

  server.onerror = (error) => console.error("[MCP Error]", error);

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Glif MCP server running on stdio");
}

main().catch(console.error);
