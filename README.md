# glif-mcp


MCP server for running AI workflows from glif.app

For more info check out https://glif.app or join our Discord server: https://discord.gg/glif

## Features

- Run glifs with inputs
- Get detailed information about glifs, runs, and users
- Access glif metadata through URI-based resources

## Setup

### Installing and running locally

First, checkout this code and install dependencies. This assumes you have a recent-ish version of Nodejs:

```sh
git clone https://github.com/glifxyz/glif-mcp-server
cd glif-mcp-server
npm install
npm run build
# there's now a build/index.js file which is what we'll run next
```

Then configure your MCP client (e.g. Claude Desktop) to load this server

1. Get your API token from https://glif.app/settings/api-tokens
2. Add the server in your Claude Desktop config file. on macOS this is: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

### Install and run remotely with Smithery

To install glif-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@glifxyz/glif-mcp-server),
which hosts and runs the MCP server for you:

```bash
npx -y @smithery/cli install @glifxyz/glif-mcp-server --client claude
```

## Usage Limits

- Subject to same limits as user accounts
- Purchase more credits at https://glif.app/pricing

## Resources

- `glif://{id}` - Get glif metadata
- `glifRun://{id}` - Get run details
- `glifUser://{id}` - Get user profile

## Tools

General glif running & info:

- `run_glif` - Execute a glif with inputs
- `glif_info` - Get detailed metadata about a glif, including input fields
- `list_featured_glifs` - Get a curated list of featured glifs

Info about authenticated user's glifs:

- `my_glifs` - current user's published glifs (no drats)
- `my_liked_glifs` - current user's liked glifs
- `my_runs` - current user's public runs

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
npm run watch
```

To run the test suite (not quite working):

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

You can also look at the glif-mcp logs inside the Claude logs directy if you're using Claude Desktop.

## MCP registries


[![smithery badge](https://smithery.ai/badge/@glifxyz/glif-mcp-server)](https://smithery.ai/server/@glifxyz/glif-mcp-server)

<a href="https://glama.ai/mcp/servers/gwrql5ibq2">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/gwrql5ibq2/badge" alt="Glif MCP server" />
</a>


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
