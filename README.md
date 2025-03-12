# glif-mcp

MCP server for running AI workflows from glif.app

## Features

- Run glifs with inputs
- Get detailed information about glifs, runs, and users
- Access glif metadata through URI-based resources

## Setup

First, checkout this code and install dependencies. This assumes you have a recent-ish version of Nodejs:

```sh
git clone https://github.com/glifxyz/mcp-glif
cd mcp-glif
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

## Usage Limits

- Subject to same limits as user accounts
- Purchase more credits at https://glif.app/pricing

## Resources

- `glif://{id}` - Get glif metadata
- `glifRun://{id}` - Get run details
- `glifUser://{id}` - Get user profile

## Tools

### General Glif Tools

- `run_glif` - Run a glif with the specified ID and inputs
- `glif_info` - Get detailed information about a glif including input fields
- `list_featured_glifs` - Get a curated list of featured glifs
- `search_glifs` (TODO) - J/k this isn't implemented yet

### User-specific Tools

- `my_glifs` - Get a list of your glifs
- `my_glif_user_info` - Get detailed information about your user account, recent glifs, and recent runs

### Glif->Tool Tools (metatools)

- `save_glif_as_tool` - Save a glif as a custom tool
- `remove_glif_tool` - Remove a saved glif tool
- `list_saved_glif_tools` - List all saved glif tools

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
