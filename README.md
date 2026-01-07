# glif-mcp-server

MCP server for running AI workflows from glif.app.

This server provides tools for running workflows, managing agents, and accessing workflow metadata through the Model Context Protocol (MCP).

For more info check out https://glif.app or join our Discord server: https://discord.gg/glif

## Features

- Run workflows with inputs
- Get detailed information about workflows, runs, and users
- Access workflow metadata through URI-based resources
- Load agents with their skills as callable tools

## Setup

### Running via npx (recommended)

If you have nodejs installed, you can run our [@glifxyz/glif-mcp-server](https://www.npmjs.com/package/@glifxyz/glif-mcp-server) package via npx:

1. Get your API token from https://glif.app/settings/api-tokens
2. Add the server in your Claude Desktop config file. On macOS this is: `~/Library/Application Support/Claude/claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "glif": {
         "command": "npx",
         "args": ["-y", "@glifxyz/glif-mcp-server@latest"],
         "env": {
           "GLIF_API_TOKEN": "your-token-here"
         }
       }
     }
   }
   ```

### Running from a local checkout

First, checkout this code and install dependencies.

```sh
git clone https://github.com/glifxyz/glif-mcp-server
cd glif-mcp-server
npm install
npm run build
# there's now a build/index.js file which is what we'll run next
```

Then configure your MCP client (e.g. Claude Desktop) to load this server from disk.

   ```json
   {
     "mcpServers": {
       "glif": {
         "command": "node",
         "args": ["/path/to/glif-mcp/build/index.js"],
         "env": {
           "GLIF_API_TOKEN": "your-token-here"
         }
       }
     }
   }
   ```

You can also specify workflow IDs (comma-separated) which will be loaded automatically when the server starts. This is useful for testing or if you want to share a pre-made workflow configuration with someone else.

```json
{
  "mcpServers": {
    "glif": {
      "command": "node",
      "args": ["/path/to/glif-mcp/build/index.js"],
      "env": {
        "GLIF_API_TOKEN": "your-token-here",
        "GLIF_IDS": "cm2v9aiga00008vfqdiximl2m,cm2v98jk6000r11afslqvooil,cm2v9rp66000bat9wr606qq6o"
      }
    }
  }
}
```

### Run remotely with Smithery

To install glif-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@glifxyz/glif-mcp-server),
which hosts and runs the MCP server for you:

```bash
npx -y @smithery/cli install @glifxyz/glif-mcp-server --client claude
```

## Usage Limits

- Subject to same limits as user accounts
- Purchase more credits at https://glif.app/pricing

## Resources

- `glif://{id}` - Get workflow metadata
- `glifRun://{id}` - Get run details
- `glifUser://{id}` - Get user profile

## Configuration

Environment variables:

- `GLIF_API_TOKEN` - **Required.** Your API token from https://glif.app/settings/api-tokens
- `GLIF_IDS` - Optional. Comma-separated workflow IDs to load as tools automatically
- `IGNORE_DISCOVERY_TOOLS` - Set to `true` to disable discovery tools (enabled by default)
- `AGENT_TOOLS` - Set to `true` to enable agent tools (disabled by default). Also accepts `BOT_TOOLS` for backward compatibility.

## Tools

### Core Tools (always enabled)

- `run_workflow` - Run a workflow with the specified ID and inputs
- `workflow_info` - Get detailed information about a workflow including input fields

### Discovery Tools (enabled by default)

- `list_featured_workflows` - Get a curated list of featured workflows
- `search_workflows` - Search for workflows by name or description
- `my_workflows` - Get a list of your workflows
- `my_user_info` - Get detailed information about your account, recent workflows, and recent runs

### Agent Tools (disabled by default, enable with `AGENT_TOOLS=true`)

- `list_agents` - Get a list of agents
- `load_agent` - Load an agent and automatically save its skills as tools
- `save_agent_skills_as_tools` - Save all skills from an agent as individual tools

## MCP registries

[![smithery badge](https://smithery.ai/badge/@glifxyz/glif-mcp-server)](https://smithery.ai/server/@glifxyz/glif-mcp-server)

<a href="https://glama.ai/mcp/servers/gwrql5ibq2">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/gwrql5ibq2/badge" alt="Glif MCP server" />
</a>

## Development

Install dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run dev
```

To run the test suite:

```sh
npm run test
```

And to continuously run tests on changes:

```sh
npm run test:watch
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

You can also look at the glif-mcp logs inside the Claude logs directory if you're using Claude Desktop.

### Releasing a new version

1. Edit `package.json` and `src/index.ts` and bump the version number
2. Run `npm install` to update the versions stored in the lockfile
3. Commit and push your changes to GitHub and merge to main
4. If you have [gh](https://cli.github.com/) installed, switch to main and run `npm run release` which will create a git tag for the new version, push that tag to github, and use `gh release create` to publish a new version with an automatically-generated changelog. If you don't have `gh`, you can do the above manually in the GitHub web UI
5. A GitHub Action will use the `NPM_TOKEN` secret to publish it to NPM

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
