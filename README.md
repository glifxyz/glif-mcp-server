# glif-mcp-server

MCP server for running AI workflows from glif.app.

This server provides tools for running glifs, managing bots, and accessing glif metadata through the Model Context Protocol (MCP).

This server also allows for customizing all the tools available via add-tool, remove-tool etc meta-tools, including lot full glif agents as a set of tools (and personality). This is highly experimental.

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

You can also specify glifs IDs (comma-separated) which will be loaded automatically when the server starts. This is useful for testing or if you want to share a pre-made glif configuration with someone else.

```json
{
  "mcpServers": {
    "glif": {
      "command": "node",
      "args": ["/path/to/glif-mcp/build/index.js"],
      "env": {
        "GLIF_API_TOKEN": "your-token-here",
        "GLIF_IDS": "cm2v9aiga00008vfqdiximl2m,cm2v98jk6000r11afslqvooil,cm2v9rp66000bat9wr606qq6o",
        "IGNORE_SAVED_GLIFS": true,
      }
    }
  }
}


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

### General Glif Tools

- `run_glif` - Run a glif with the specified ID and inputs
- `glif_info` - Get detailed information about a glif including input fields
- `list_featured_glifs` - Get a curated list of featured glifs
- `search_glifs` - Search for glifs by name or description

### Bot Tools

- `list_bots` - Get a list of featured bots and sim templates
- `load_bot` - Get detailed information about a specific bot, including its skills
- `save_bot_skills_as_tools` - Save all skills from a bot as individual tools

### User-specific Tools

- `my_glifs` - Get a list of your glifs
- `my_glif_user_info` - Get detailed information about your user account, recent glifs, and recent runs

### Glif->Tool Tools (metatools)

- `save_glif_as_tool` - Save a glif as a custom tool
- `remove_glif_tool` - Remove a saved glif tool
- `remove_all_glif_tools` - Remove all saved glif tools and return to a pristine state
- `list_saved_glif_tools` - List all saved glif tools

## How to turn glifs into custom tools

We have a general `run_glif` tool, but it (a) isn't very descriptive, and (b) requires doing a `glif_info` call first in order to learn how to call said glif. Plus, you need to know that glif exists.

We're experimenting with several new meta-tools which turn specific glifs into new standalone tools:

An example prompt session:

- what are some cool new glifs?
- [toolcall: `list_featured_glifs`...]
- ok i like 1970s sci-fi book cover generator, make that into a tool called "scifi_book_image"
- [toolcall: `save_glif_as_tool glifId=... toolName=scifi_book_image`]
- [now user can just type "make sci fi book image of blah"]

You can list these special tools with `list_saved_glif_tools` and remove any you don't like with `remove_glif_tool`

Note that Claude Desktop requires a restart to load new tool definitions. Cline & Cursor seem to reload automatically on changes and requery for available tools

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

You can also look at the glif-mcp logs inside the Claude logs directy if you're using Claude Desktop.

## MCP registries

[![smithery badge](https://smithery.ai/badge/@glifxyz/glif-mcp-server)](https://smithery.ai/server/@glifxyz/glif-mcp-server)

<a href="https://glama.ai/mcp/servers/gwrql5ibq2">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/gwrql5ibq2/badge" alt="Glif MCP server" />
</a>

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
