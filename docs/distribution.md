# Distributing Glif's MCP server and plugin

This repo is the public home for Glif's hosted MCP server (`https://glif.app/api/mcp`), its plugin and its public skills. This doc lists what ships from here, where Glif is listed, and where to list it next. Research date: October 6, 2026. Directory rules change often, so recheck a link before you submit.

## What ships from this repo

One `skills/` folder is shared by every manifest. All MCP configs point at the same server name (`glif`) and URL, so it doesn't matter which manifest a host picks.

| File | What reads it |
| --- | --- |
| `.claude-plugin/plugin.json`, `.mcp.json` | Claude Code, claude.ai and Cowork plugins ([manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference)). Devin and Factory Droid also load this format. |
| `.claude-plugin/marketplace.json` | `/plugin marketplace add glifxyz/glif-mcp-server`. Codex and Copilot CLI read it too. |
| `plugin.json`, `mcp.json` | The portable [Agent Plugins 1.0.0](https://agent-plugins.org/plugin-authors/manifest) format: ChatGPT, Codex, VS Code, Copilot, Cursor, Kiro, Devin and [others](https://agent-plugins.org/compatible-clients). OpenAI listing fields live under `extensions.com.openai`. |
| `gemini-extension.json` | Gemini CLI ([reference](https://github.com/google-gemini/gemini-cli/blob/main/docs/extensions/reference.md)). It uses `httpUrl`, because `url` means SSE there. |
| `skills/<name>/SKILL.md` | Any [Agent Skills](https://agentskills.io/specification) host, and `npx skills add`. |
| `skills/<name>/agents/openai.yaml` | Codex and ChatGPT. It tells them a standalone skill needs the Glif server. Other hosts ignore it. |
| `server.json` | The [official MCP Registry](https://registry.modelcontextprotocol.io). GitHub, Glama, PulseMCP, VS Code and Zed pull from it. |
| `glama.json` | Claims the [Glama listing](https://glama.ai/mcp/servers/@glifxyz/glif-mcp-server). |
| `llms-install.md` | Agents installing the server for a user, including Cline's marketplace review. |

Checked locally on October 6: the Claude validator passes in strict mode, every skill passes `agentskills validate`, and the Agent Plugins and `server.json` files match their schemas. `claude plugin install` and `codex plugin add` both installed the plugin with four skills and the `glif` server waiting for sign-in. Gemini CLI isn't installed here, so its manifest is unchecked.

Skipped on purpose:

- **Google Antigravity.** It also reads a root `plugin.json`, but with a stricter schema that rejects our fields ([docs](https://antigravity.google/docs/plugins?tab=cli)). If we want it, ship a copy in a subfolder.
- **`.codex-plugin/` and `.cursor-plugin/`.** The root Agent Plugins files replace them. Add `.cursor-plugin/plugin.json` only if Cursor's marketplace review asks for a logo.
- **Claude Desktop Extensions (`.mcpb`).** They're for local servers, and the Claude directory no longer takes them ([docs](https://claude.com/docs/directory/publish)).

## Where Glif is listed today

| Where | Status |
| --- | --- |
| Official MCP Registry | `app.glif/glif` 1.0.1 is live and matches `server.json`. |
| GitHub MCP Registry | [Listed](https://github.com/mcp/app.glif/glif). It shows the repo description, which still says "Deprecated". |
| Glama | Listed as a [server](https://glama.ai/mcp/servers/@glifxyz/glif-mcp-server) and a [connector](https://glama.ai/mcp/connectors/app.glif/glif). |
| Smithery | An [old listing](https://smithery.ai/server/@glifxyz/glif-mcp-server) exists. Check whether it still points at the stdio package. |
| ChatGPT | A plugin package with review cases sits on the `chatgpt-plugin-2` branch of glif-graph (`plugins/glif/`). It hasn't been submitted. |

## Where to list next

Ordered by reach for the effort. Effort: low is under an hour, medium is a form plus testing, high is a review cycle with a demo account.

| # | Where | Who it reaches | How | Effort |
| --- | --- | --- | --- | --- |
| 1 | This repo as a marketplace | Claude Code, claude.ai, Codex, Copilot, Cursor, Devin, Droid users | Push these changes to `main`. Installs then work straight from GitHub. | Done once pushed |
| 2 | GitHub repo description and topics | Every listing that reads the repo | Replace "Deprecated..." with a real description. Add topics `claude-code-plugin`, `agent-skills`, `gemini-cli-extension` and `mcp`. The `gemini-cli-extension` topic puts us in the [Gemini gallery](https://geminicli.com/docs/extensions/releasing) automatically. | Low |
| 3 | [skills.sh](https://skills.sh/docs/faq) | 70+ coding agents | No form. Listing appears after people run `npx skills add glifxyz/glif-mcp-server`, ranked by installs. Put the command in docs and posts. | Low |
| 4 | [Smithery](https://smithery.ai/docs/build/publish) | Developers using its CLI | Publish the hosted URL with `smithery mcp publish "https://glif.app/api/mcp" -n @glif/glif`, or fix the old listing. Its scanner needs a 401 (not 403) from unauthenticated calls, which we already return. | Low |
| 5 | [awesome-remote-mcp-servers](https://github.com/punkpeye/awesome-remote-mcp-servers/blob/main/CONTRIBUTING.md) | Developers | PR a three-line entry with our Glama connector badge. Starring the repo is required. | Low |
| 6 | [Cursor Marketplace](https://cursor.com/marketplace/publish) | Cursor users | Submit this repo. The root Agent Plugins files are enough. | Low to medium |
| 7 | [Cline marketplace](https://github.com/cline/marketplace) | Cline users | PR `registry/mcps/glif/entry.json`. Skills and plugins can go in the same way. | Low |
| 8 | [ClawHub](https://docs.openclaw.ai/clawhub) | OpenClaw users | `clawhub skill publish ./skills/<name>` per skill. OpenClaw users add the server with `openclaw mcp add glif --url https://glif.app/api/mcp --transport streamable-http` ([docs](https://docs.openclaw.ai/tools/mcp)). | Low to medium |
| 9 | [Meta Muse Connector Platform](https://muse.ai/platform) | Muse app and WhatsApp users | Opened September 18. A three-step form: overview, technical details ("Existing MCP"), review. It needs a 512×512 icon, example prompts, privacy and terms links, a test account and a demo ([guidelines](https://muse.ai/platform/docs)). Meta asks for OAuth client credentials or an API key, so check whether they support dynamic client registration. | Medium |
| 10 | [Perplexity connectors](https://www.perplexity.ai/help-center/en/articles/2026092501-submit-a-connector-proposal) | Perplexity Pro and Enterprise | Proposal form, or email connectors@perplexity.ai. Users can already add Glif as a custom connector. | Low |
| 11 | [Docker MCP Catalog](https://github.com/docker/mcp-registry/blob/main/CONTRIBUTING.md) | Docker Desktop users | PR made with `task remote-wizard` (`type: remote`, OAuth). | Medium |
| 12 | [ChatGPT and Codex directory](https://developers.openai.com/plugins/deploy/submission) | ChatGPT and Codex users | Upload a ZIP at platform.openai.com/plugins. Needs a verified org, the `/.well-known/openai-apps-challenge` token on glif.app, a reviewer account with credits, five positive and three negative test cases, and a demo video. One listing covers both apps. | High |
| 13 | [Claude directory](https://claude.ai/directory/manage) | claude.ai, Desktop, Cowork, Claude Code | See "The Claude catch" below. | High, likely rejected |
| 14 | [Microsoft Copilot Studio certification](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-server-certification) | Enterprise Microsoft 365 | Partner Center enrollment, a connector package and a Responsible AI review. | High |

Smaller web directories take a form and little else: [mcp.so](https://mcp.so/submit), [MCP Market](https://mcpmarket.com/submit) (servers and skills) and LobeHub (through its CLI). [SkillsMP](https://skillsmp.com/about) and [claudemarketplaces.com](https://claudemarketplaces.com/skills) crawl public `SKILL.md` files, so they'll find us once this merges.

## The Claude catch

Anthropic's directory doesn't accept AI image, video or audio generation. The [connector review criteria](https://claude.com/docs/connectors/building/review-criteria) say so outright. The [Software Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy) applies the same rule to plugins and skills, "unless otherwise expressly permitted by us in writing". It allows design tools that make slides, diagrams, mockups or logos, but not standalone media generation.

What that means:

- Our own marketplace isn't reviewed, so `claude plugin marketplace add glifxyz/glif-mcp-server` works now. claude.ai users can add the same marketplace under Customize → Plugins.
- The error you saw ("This folder is not a plugin...") most likely came from the portal's **Validate** step. The repo now has `.claude-plugin/plugin.json`, and the local validator passes in strict mode. Passing validation doesn't mean the listing would be approved.
- Before submitting, ask Anthropic for written permission. Contacts: mcp-review@anthropic.com or a partner contact. Pitch the design angle (campaigns, brand assets, mockups), not "a media generator".
- The same policy forbids pulling user-uploaded files. Our `image-video-audio` skill only uploads a file after the user agrees. Expect a reviewer to ask about it.

## ChatGPT and Codex

The glif-graph package has everything the OpenAI review needs: listing copy, eight review cases, release notes and a ZIP builder (`pnpm mcp:chatgpt-package`). This repo's root `plugin.json` copies its listing fields but leaves out the review block, which names private test fixtures.

Two differences to settle before submitting:

- Its skills use `progress_cursor`, which isn't on the production server yet. These skills use `wait_seconds`, which is.
- Its skills say `view_media` is unavailable. These skills use it when the host can render Glif's viewer.

Pick one source of truth. Easiest path: keep the skills here and have the glif-graph packager copy them in. Then edit one set of skills, not two.

## Hosts with no directory

These need no listing. Users paste a config, so put good snippets on [glif.app/mcp](https://glif.app/mcp).

- **Hermes Agent:** `mcp_servers` in `~/.hermes/config.yaml` ([reference](https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference/)). Its skills hub pulls from public registries.
- **OpenClaw:** the `openclaw mcp add` command above.
- **Replit:** an "Add to Replit" link, `https://replit.com/integrations?mcp=<base64 of {displayName, baseUrl}>` ([docs](https://docs.replit.com/build/connect-via-mcp)).
- **Goose:** `goose://extension?url=https%3A%2F%2Fglif.app%2Fapi%2Fmcp&type=streamable_http&id=glif&name=Glif`.
- **LM Studio:** `lmstudio://add_mcp?name=glif&config=eyJ1cmwiOiJodHRwczovL2dsaWYuYXBwL2FwaS9tY3AifQ%3D%3D`.
- **VS Code:** `vscode:mcp/install?%7B%22name%22%3A%22glif%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A//glif.app/api/mcp%22%7D`.
- **Notion custom agents, Lovable, Manus, Raycast, Le Chat, Windows (`odr.exe mcp add`):** custom URL only. Le Chat has a connector directory but no public submission form.
- **Zed:** reads the official MCP Registry. Don't build a Zed extension.

## Discovery files on glif.app

These live in glif-graph, not here.

- `/.well-known/openai-apps-challenge`: plain-text token for the OpenAI review.
- An [MCP Server Card](https://modelcontextprotocol.io/seps/2127-mcp-server-cards) at `https://glif.app/api/mcp/server-card`. It's the new standard way for clients to discover a server from its domain.
- `/.well-known/agent-skills/index.json` from Cloudflare's [draft spec](https://github.com/cloudflare/agent-skills-discovery-rfc). It points crawlers at our `SKILL.md` files.
- `llms.txt` already exists. Add the plugin install commands to it.

## Later

- **Evals.** `claude plugin eval` runs prompt-and-grader cases from `evals/`. Port the eight ChatGPT review cases so we catch skill regressions before resubmitting anywhere.
- **API-key header in `server.json`.** The registry can describe an optional `Authorization` header (`isSecret: true`) for clients without OAuth. Add it with the next registry version bump.
