#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { performance } from "node:perf_hooks";
import { z } from "zod";
import {
  GlifRunResponseSchema,
  GlifSchema,
  GlifRunSchema,
  SearchParamsSchema,
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
      },
    }
  );

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
        name: "search_glifs",
        description: "Search for glifs or get details about specific glifs",
        inputSchema: {
          type: "object",
          properties: {
            q: {
              type: "string",
              description: "Search query (optional)",
            },
            featured: {
              type: "boolean",
              description: "Only return featured glifs (optional)",
            },
            id: {
              type: "string",
              description: "Get details for a specific glif ID (optional)",
            },
          },
        },
      },
      {
        name: "show_glif",
        description:
          "Show detailed information about a glif and its recent runs",
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
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "search_glifs": {
        const args = SearchGlifsArgsSchema.parse(request.params.arguments);
        const results = await searchGlifs(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case "show_glif": {
        const args = ShowGlifArgsSchema.parse(request.params.arguments);
        const { glif, recentRuns } = await getGlifDetails(args.id);
        return {
          content: [
            {
              type: "text",
              text: formatGlifDetails(glif, recentRuns),
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
