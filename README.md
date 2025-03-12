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

### Bot Tools

- `list_bots` - Get a list of featured bots and sim templates
- `load_bot` - Get detailed information about a specific bot, including its skills
- `show_bot_info` - Alias for `load_bot` with consistent naming
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

## How to explore and use bots

Glif.app hosts a variety of bots that can be used for different tasks. These bots are essentially collections of glifs with specific personalities and capabilities. You can explore and interact with these bots using the bot tools:

An example prompt session:

- what bots are available on glif.app?
- [toolcall: `list_bots`...]
- tell me more about the T-Shirt Designer bot
- [toolcall: `load_bot id=cm3oa7vzp002a7csdww668us4`]
- i want to use the Create Art skill from this bot
- [toolcall: `run_glif id=cm3och9dl000313onkn3ailhr inputs=["a futuristic robot on a white background"]`]

This allows you to discover and use the various capabilities of bots directly through the MCP server, without having to visit the Glif website.

You can also save all of a bot's skills as individual tools:

- what skills does the T-Shirt Designer bot have?
- [toolcall: `load_bot id=cm3oa7vzp002a7csdww668us4`]
- save all these skills as tools with a prefix
- [toolcall: `save_bot_skills_as_tools id=cm3oa7vzp002a7csdww668us4 prefix=tshirt_`]
- now I can use the Create Art skill directly
- [toolcall: `tshirt_create_art inputs=["a futuristic robot on a white background"]`]

If you want to remove all saved tools and start fresh:

- [toolcall: `remove_all_glif_tools`]

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
