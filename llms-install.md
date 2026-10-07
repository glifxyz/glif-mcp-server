# Installing the Glif MCP server (instructions for AI agents)

Glif is a **hosted remote MCP server**. There is nothing to download, build or run locally.

1. Add a remote MCP server with:
   - **URL:** `https://glif.app/api/mcp`
   - **Transport:** Streamable HTTP
   - **Name:** `glif`
2. No API key or environment variables are needed. Authentication is OAuth 2.1 with dynamic client registration. On first connection, the client opens a browser window to sign in at glif.app. The user approves, and the client stores the token.
3. Verify the install by calling the `whoami` tool. It returns the signed-in Glif account, plan and credit balance.

Example config for clients using an `mcpServers` JSON block:

```json
{ "mcpServers": { "glif": { "url": "https://glif.app/api/mcp", "transport": "http" } } }
```

If the client supports plugins (Claude Code, Codex, Cursor, VS Code, Copilot, Gemini CLI), install the plugin from `https://github.com/glifxyz/glif-mcp-server` instead. It adds the server plus Glif's public skills. See the README for commands.

Notes:

- If the client cannot complete OAuth, the user needs a free account at https://glif.app first. Clients without OAuth can send a `glif_v1_...` API key from https://glif.app/settings/api-tokens as `Authorization: Bearer <key>`.
- Do not configure a localhost URL. The server is hosted only at `https://glif.app/api/mcp`.
- `compose_project` returns a `jobId` right away. Generation can take minutes. Follow it with `get_job_status`, passing the `jobId` as `job_id`.
