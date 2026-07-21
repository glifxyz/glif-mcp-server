# glif-mcp-server

> [!IMPORTANT]
> **This locally-run MCP server is deprecated.** Glif now has a hosted MCP server — no install, no API token config, just OAuth. Get started at **[glif.app/mcp](https://glif.app/mcp)**.
>
> The old local server code is parked on the [`legacy-local-server`](https://github.com/glifxyz/glif-mcp-server/tree/legacy-local-server) branch.

![Glif MCP](https://glifusercontent.com/i:r/c_limit,w_3840/f_auto/q_auto/biqv7x3jy8tbovm4ow6a)

## The hosted Glif MCP server

Glif's MCP server gives any MCP client (Claude, ChatGPT, Cursor, etc.) access to Glif: AI image, video, and audio generation, media workflows, and your Glif projects.

- **Endpoint:** `https://glif.app/api/mcp`
- **Auth:** OAuth — sign in with your Glif account, no API tokens to manage
- **Transport:** Streamable HTTP (JSON-RPC 2.0)

Tools include `compose_project` (create/continue media-generation projects), `get_job_status`, `list_projects`, `get_project`, `view_media`, `upload_file`, `list_user_skills`, `get_user_skill`, and `whoami`.

### Connect from Claude

1. Go to **Settings → Connectors → Add custom connector**
2. Paste `https://glif.app/api/mcp`
3. Approve the Glif OAuth flow when prompted

Full docs, client setup guides, and a plain HTTP API: **https://glif.app/mcp**

For more info check out https://glif.app or join our Discord: https://discord.gg/glif

## License

MIT - see [LICENSE](LICENSE)
