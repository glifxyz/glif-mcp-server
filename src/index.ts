#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupPromptHandlers } from "./prompts.js";
import { setupResourceHandlers } from "./resources.js";
import { registerAllTools } from "./tools/index.js";

async function main() {
  const server = new McpServer({
    name: "glif",
    version: "1.0.0",
  });

  // Register all tools using the new high-level API
  await registerAllTools(server);

  // Setup resources and prompts (these still use the low-level server)
  setupResourceHandlers(server.server);
  setupPromptHandlers(server.server);

  server.server.onerror = (error) => console.error("[MCP Error]", error);

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Glif MCP server running on stdio");
}

main().catch(console.error);
