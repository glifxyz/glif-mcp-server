# Installing the Glif MCP server (instructions for AI agents)

Glif is a **hosted remote MCP server** — there is nothing to download, build, or run locally.

1. Add a remote MCP server with:
   - **URL:** `https://glif.app/api/mcp`
   - **Transport:** Streamable HTTP
   - **Name:** `glif`
2. No API key or environment variables are needed. Authentication is OAuth 2.1 with dynamic client registration: on first connection (or first tool call), the client opens a browser window to sign in at glif.app. The user approves the sign-in and the client stores the token.
3. Verify the install by calling the `whoami` tool — it returns the signed-in user's Glif account, plan, and credit balance.

Example config for clients using an `mcpServers` JSON block:

```json
{ "mcpServers": { "glif": { "url": "https://glif.app/api/mcp", "transport": "http" } } }
```

Notes:

- If the client cannot complete OAuth, the user needs a free account at https://glif.app first.
- Do not configure a localhost URL; the server is hosted only at `https://glif.app/api/mcp`.
- Media generation (`compose_project`) can take minutes; the server supports MCP tasks for async polling.
