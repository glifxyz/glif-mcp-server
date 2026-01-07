#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupPromptHandlers } from "./prompts.js";
import { setupResourceHandlers } from "./resources.js";
import { setupToolHandlers } from "./tools/index.js";

const SERVER_VERSION = "0.9.11";

async function main() {
  const server = new Server(
    {
      name: "glif",
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: { listChanged: true },
        resources: {},
        prompts: {},
      },
    }
  );

  // Setup all handlers using low-level API (supports dynamic tool registration)
  setupToolHandlers(server);
  setupResourceHandlers(server);
  setupPromptHandlers(server);

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
