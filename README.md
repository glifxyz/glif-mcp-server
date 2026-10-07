<p align="center">
  <img src="assets/glif-icon-400.png" width="120" alt="Glif" />
</p>

# Glif MCP Server and Plugin

**Glif** is a creative agent. Describe what you want to make, and it picks the models and does the work across images, video and audio. It also transcribes, renders HTML, searches the web, runs code and chains multi-step media jobs.

- **Endpoint:** `https://glif.app/api/mcp` (Streamable HTTP, JSON-RPC 2.0)
- **Auth:** OAuth 2.1 sign-in with your Glif account. Plain HTTP clients can send a `glif_v1_...` API key from [glif.app/settings/api-tokens](https://glif.app/settings/api-tokens) as a bearer token.
- **Install page with one-click buttons:** https://glif.app/mcp
- **Docs for agents:** https://glif.app/llms.txt

This repo holds three things:

- A plugin for Claude, Codex, ChatGPT, Cursor, VS Code, Copilot and Gemini CLI. It connects the hosted server and bundles public skills.
- Public [Agent Skills](https://agentskills.io) in [`skills/`](skills).
- Registry metadata for the hosted server ([`server.json`](server.json)). The server itself runs on glif.app and is not open source.

> [!NOTE]
> Looking for the old locally run stdio server (npm `@glifxyz/glif-mcp-server`)? It's deprecated. The code is parked on the [`legacy-local-server`](https://github.com/glifxyz/glif-mcp-server/tree/legacy-local-server) branch.

## Install the plugin

The plugin adds the Glif server plus the skills below. Your client opens a browser sign-in the first time it connects.

### Claude Code

```sh
claude plugin marketplace add glifxyz/glif-mcp-server
claude plugin install glif@glif
```

In a session, `/plugin marketplace add glifxyz/glif-mcp-server` then `/plugin install glif@glif` does the same. Run `/mcp` to sign in.

### Claude (web and desktop)

Customize → Plugins → **Add marketplace**, then enter `glifxyz/glif-mcp-server`. To add only the server, go to Settings → Connectors → **Add custom connector** and paste `https://glif.app/api/mcp`.

### Codex

```sh
codex plugin marketplace add glifxyz/glif-mcp-server
codex plugin add glif@glif
codex mcp login glif
```

### Gemini CLI

```sh
gemini extensions install https://github.com/glifxyz/glif-mcp-server
```

### Skills only

Any agent that reads Agent Skills can install them with [skills.sh](https://skills.sh):

```sh
npx skills add glifxyz/glif-mcp-server
```

The skills need the Glif server connected too.

## Add just the server

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

Turn on developer mode, then Settings → Apps & Connectors → **Add new connector**. Paste `https://glif.app/api/mcp` and pick OAuth.

### Claude Code (server only)

```sh
claude mcp add --scope user --transport http glif https://glif.app/api/mcp
```

### Any other MCP client

```json
{ "mcpServers": { "glif": { "url": "https://glif.app/api/mcp", "transport": "http" } } }
```

More clients (Replit, Hermes, OpenClaw, LM Studio and others) have copy-paste snippets at https://glif.app/mcp.

## Skills

| Skill | Use it to |
| --- | --- |
| [`get-started`](skills/get-started/SKILL.md) | Check the connected account and credits, and learn how projects work. Never generates. |
| [`campaign-concepts`](skills/campaign-concepts/SKILL.md) | Plan a set of matching images, video and audio, then make it in one project. |
| [`image-video-audio`](skills/image-video-audio/SKILL.md) | Turn a reference file into new media, such as animating an image. |
| [`continue-project`](skills/continue-project/SKILL.md) | Reopen saved work and add variations or follow-ups to it. |

Every skill waits for an explicit request before spending credits.

## Tools

`compose_project` does the work. Describe what you want in plain language, including a whole series of variations. It returns a `jobId` and a `projectUrl` right away. Pass the `jobId` to `get_job_status` as `job_id` to follow the run and get the media links. The other tools read projects, reopen media, upload reference files and check your account. Call `tools/list` for the full set, or see https://glif.app/mcp.

Generation spends credits from the signed-in Glif account. Reading and browsing are free. See https://glif.app/pricing.

## Develop

[`docs/distribution.md`](docs/distribution.md) lists every manifest in this repo and where we list Glif. CI checks all manifests on each PR. To check locally:

```sh
claude plugin validate --strict .
for skill in skills/*/; do uvx --from skills-ref agentskills validate "$skill"; done
```

The plugin version lives in `.claude-plugin/plugin.json`, `plugin.json` and `gemini-extension.json`. Bump all three together; CI fails if they differ. Publish `server.json` to the MCP Registry by bumping its `version` and tagging `v<version>` (see [`publish.yml`](.github/workflows/publish.yml)).

## Links

- Website: https://glif.app
- MCP install page: https://glif.app/mcp
- Discord: https://discord.gg/glif
- X: https://x.com/heyglif

## License

MIT. See [LICENSE](LICENSE).
