#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupResourceHandlers } from "./resources.js";
import { setupPromptHandlers } from "./prompts.js";
import { setupToolHandlers } from "./tools.js";

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

  // Set up handlers from modular components
  setupResourceHandlers(server);
  setupPromptHandlers(server);
  setupToolHandlers(server);

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
