# Glif MCP server, plugin and skills

This repo is public. Everything in it is published: files, history, commit messages, PR titles, PR descriptions and comments. Plugin directories, MCP registries, skill crawlers and security scanners copy it, and reviewers at Anthropic and OpenAI read all of it.

## Write only for users

Every file here is user-facing documentation, a manifest or a skill. Before you add a sentence, ask: would we be happy to see this quoted on a directory listing?

Keep out of this repo, including commits and PRs:

- names, branches or paths of private repos, such as glif-graph
- plans, roadmaps, effort estimates, launch timing and unreleased features or arguments
- store submission strategy, review notes, test cases, reviewer accounts and comments on store policies
- internal pricing figures, costs, margins, metrics, analytics and user or customer data
- staff names and personal emails (use contact@glif.xyz), internal hostnames, dev or staging URLs
- secrets, API keys, tokens, private keys and `.env` contents
- dated local-testing diaries like "checked locally on..." and candid opinions about other companies

Internal notes belong in glif-graph's `docs/store-submissions.md`, which is private.

Describe only what production does today. Skills may tell agents that video uses more credits than images, but they link to https://glif.app/pricing rather than quoting numbers.

## Before you commit

- Read the full diff and your commit message against the list above.
- Never commit ignored files such as `.env` or `key.pem`. Stage files by name.
- Run the checks CI runs:

```sh
claude plugin validate --strict .
for skill in skills/*/; do uvx --from skills-ref agentskills validate "$skill"; done
```

## Repo facts

- The hosted server is `https://glif.app/api/mcp`. Every manifest names it `glif`.
- `.claude-plugin/` is the Claude plugin and marketplace. Root `plugin.json` and `mcp.json` are the Agent Plugins format. `gemini-extension.json` is Gemini CLI. `server.json` is the MCP Registry.
- Bump `version` in `.claude-plugin/plugin.json`, `plugin.json` and `gemini-extension.json` together. CI fails if they differ.
- Publish `server.json` by bumping its `version` and tagging `v<version>`.
