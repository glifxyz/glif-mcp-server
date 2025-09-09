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

- `glif://{id}` - Get glif metadata
- `glifRun://{id}` - Get run details
- `glifUser://{id}` - Get user profile

## Configuration

Environment variables to control which tool groups are enabled:

- `GLIF_API_TOKEN` - **Required.** Your API token from https://glif.app/settings/api-tokens
- `GLIF_IDS` - Optional. Comma-separated glif IDs to load as tools automatically
- `IGNORE_DISCOVERY_TOOLS` - Set to `true` to disable discovery tools (enabled by default)
- `IGNORE_METASKILL_TOOLS` - Set to `true` to disable metaskill tools (enabled by default)
- `IGNORE_SAVED_GLIFS` - Set to `true` to disable saved glif tools (enabled by default)
- `BOT_TOOLS` - Set to `true` to enable bot tools (disabled by default)

## Tools

### Core Tools (always enabled)

- `run_glif` - Run a glif with the specified ID and inputs
- `glif_info` - Get detailed information about a glif including input fields

### Discovery Tools (enabled by default, disable with `IGNORE_DISCOVERY_TOOLS=true`)

- `list_featured_glifs` - Get a curated list of featured glifs
- `search_glifs` - Search for glifs by name or description
- `my_glifs` - Get a list of your glifs
- `my_glif_user_info` - Get detailed information about your user account, recent glifs, and recent runs

### Metaskill Tools (enabled by default, disable with `IGNORE_METASKILL_TOOLS=true`)

- `save_glif_as_tool` - Save a glif as a custom tool
- `remove_glif_tool` - Remove a saved glif tool
- `remove_all_glif_tools` - Remove all saved glif tools and return to a pristine state
- `list_saved_glif_tools` - List all saved glif tools

### Bot Tools (disabled by default, enable with `BOT_TOOLS=true`)

- `list_bots` - Get a list of featured bots and sim templates
- `load_bot` - Get detailed information about a specific bot, including its skills
- `save_bot_skills_as_tools` - Save all skills from a bot as individual tools
- `show_bot_info` - Get detailed information about a specific bot

### Saved Glif Tools (enabled by default, disable with `IGNORE_SAVED_GLIFS=true`)

Dynamic tools created from glifs you've saved using the metaskill tools. Each saved glif becomes its own tool with a custom name and description.

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

You can also look at the glif-mcp logs inside the Claude logs directy if you're using Claude Desktop.

### Releasing a new version

The release process is now automated with proper version synchronization between `package.json` and `server.json`:

1. **Bump version**: Edit `package.json` and bump the version number
2. **Update dependencies**: Run `npm install` to update the lockfile
3. **Commit changes**: Commit and push your changes to GitHub and merge to main
4. **Release**: Switch to main branch and run `npm run release`

The release script will automatically:
- ✅ Verify you're on the main branch with a clean working directory
- 🔄 Sync versions between `package.json` and `server.json`  
- 🧪 Run tests and build the project
- 🔍 Run type checking
- 🏷️ Create and push a git tag
- 📝 Generate a changelog and create a GitHub release
- 🌐 Publish to the MCP registry (if configured)
- 📤 NPM publication happens via GitHub Actions

#### Additional release commands:

- `npm run release:dry-run` - See what version would be released
- `npm run sync-versions` - Manually sync versions between package.json and server.json
- `npm run mcp:publish` - Manually publish to MCP registry

#### Requirements:

- [GitHub CLI (gh)](https://cli.github.com/) must be installed and authenticated
- [MCP Publisher CLI](https://github.com/modelcontextprotocol/registry) for MCP registry publishing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
