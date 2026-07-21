<p align="center">
  <img src="assets/glif-icon-400.png" width="120" alt="Glif" />
</p>

# Glif MCP Server

**Glif** is a media-generation agent: generate images, video, and audio, transcribe, render HTML, search the web, run code, and chain multi-step media operations — from any MCP client.

- **Endpoint:** `https://glif.app/api/mcp` (Streamable HTTP, JSON-RPC 2.0)
- **Auth:** OAuth 2.1 with dynamic client registration — sign in with your Glif account, no API keys
- **Install page with one-click buttons:** https://glif.app/mcp
- **Docs for agents:** https://glif.app/llms.txt

This repo holds the registry metadata for the hosted server (see [`server.json`](server.json)); the server itself is part of the glif.app platform and is not open source.

> [!NOTE]
> Looking for the old locally-run stdio server (npm `@glifxyz/glif-mcp-server`)? It's deprecated — the code is parked on the [`legacy-local-server`](https://github.com/glifxyz/glif-mcp-server/tree/legacy-local-server) branch.

## Install

### Claude (web / desktop)

Settings → Connectors → **Add custom connector**, paste:

```
https://glif.app/api/mcp
```

### Claude Code

```sh
claude mcp add --scope user --transport http glif "https://glif.app/api/mcp"
```

### Cursor

[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=glif&config=eyJ1cmwiOiJodHRwczovL2dsaWYuYXBwL2FwaS9tY3AifQ%3D%3D)

Or add to `.cursor/mcp.json`:

```json
{ "mcpServers": { "glif": { "url": "https://glif.app/api/mcp" } } }
```

### VS Code

```sh
code --add-mcp '{"name":"glif","type":"http","url":"https://glif.app/api/mcp"}'
```

### ChatGPT

Enable developer mode, then Settings → Apps & Connectors → **Add new connector**, paste `https://glif.app/api/mcp`, pick OAuth.

### Codex

```sh
codex mcp add glif --url "https://glif.app/api/mcp"
codex mcp login glif
```

### Any other MCP client

```json
{ "mcpServers": { "glif": { "url": "https://glif.app/api/mcp", "transport": "http" } } }
```

Your client opens a browser OAuth sign-in on first connect — approve it to link your Glif account. More clients (Replit, Hermes, OpenClaw, LM Studio, …) with copy-paste snippets: https://glif.app/mcp

## Tools

| Tool                                  | What it does                                                                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `compose_project`                     | Create or continue a Glif project from natural language — the server-side agent picks models and chains multi-step media workflows |
| `get_project`                         | Read project state, active job, recent messages, and generated media                                                               |
| `view_media`                          | Re-render already-generated media in the client's viewer                                                                           |
| `list_projects`                       | List your recent Glif projects                                                                                                     |
| `list_user_skills` / `get_user_skill` | Browse and fetch your personal Glif skills                                                                                         |
| `upload_file`                         | Upload image/video/audio/documents to use as inputs                                                                                |
| `whoami`                              | Your identity, plan, and credit balance                                                                                            |

Long-running generations run async via MCP tasks, so your agent isn't blocked while a video renders.

## Links

- Website: https://glif.app
- MCP install page: https://glif.app/mcp
- Discord: https://discord.gg/glif
- X: https://x.com/heyglif

## License

MIT - see [LICENSE](LICENSE)
