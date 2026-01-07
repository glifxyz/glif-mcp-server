# glif-mcp-server

MCP server for running AI workflows from glif.app.

For more info check out https://glif.app or join our Discord server: https://discord.gg/glif

## Features

- Run workflows with inputs
- Get detailed information about workflows, runs, and users
- Search and discover workflows
- Browse and load agents

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

```sh
git clone https://github.com/glifxyz/glif-mcp-server
cd glif-mcp-server
npm install
npm run build
```

Then configure your MCP client:

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

You can also specify workflow IDs (comma-separated) which will be loaded automatically:

```json
{
  "mcpServers": {
    "glif": {
      "command": "node",
      "args": ["/path/to/glif-mcp/build/index.js"],
      "env": {
        "GLIF_API_TOKEN": "your-token-here",
        "GLIF_IDS": "cm2v9aiga00008vfqdiximl2m,cm2v98jk6000r11afslqvooil"
      }
    }
  }
}
```

## Configuration

Environment variables:

- `GLIF_API_TOKEN` - **Required.** Your API token from https://glif.app/settings/api-tokens
- `GLIF_IDS` - Optional. Comma-separated workflow IDs to load as tools automatically
- `IGNORE_DISCOVERY_TOOLS` - Set to `true` to disable discovery tools
- `AGENT_TOOLS` - Set to `true` to enable agent tools

## Tools

### Core Tools

- `run_workflow` - Run a workflow with the specified ID and inputs
- `workflow_info` - Get detailed information about a workflow

### Discovery Tools (enabled by default)

- `list_featured_workflows` - Get a curated list of featured workflows
- `search_workflows` - Search for workflows by name or description
- `my_workflows` - Get a list of your workflows
- `my_user_info` - Get detailed information about your account

### Agent Tools (disabled by default, enable with `AGENT_TOOLS=true`)

- `list_agents` - Get a list of agents with optional filtering
- `load_agent` - Load an agent and get its details including personality and workflows

## Resources

- `glif://{id}` - Get workflow metadata
- `glifRun://{id}` - Get run details
- `glifUser://{id}` - Get user profile

## Development

```bash
npm install
npm run build
npm run dev     # auto-rebuild
npm run test    # run tests
```

### Debugging

```bash
npm run inspector
```

### Releasing

1. Edit `package.json` and `src/index.ts` and bump the version
2. Run `npm install` to update lockfile
3. Commit and push to main
4. Run `npm run release` (requires `gh` CLI)

## License

MIT - see [LICENSE](LICENSE)
