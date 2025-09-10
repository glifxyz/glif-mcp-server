#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupPromptHandlers } from "./prompts.js";
import { setupResourceHandlers } from "./resources.js";
import { setupToolHandlers } from "./tools/index.js";

async function main() {
  const server = new Server(
    {
      name: "glif",
      version: "0.9.9",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

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
