import { z } from "zod";
import { searchGlifs } from "../api.js";
import { formatGlifSearchResults } from "../utils/glif-formatting.js";
import { createTextResponse, createTool } from "../utils/tool-factory.js";
import type { ToolResponse } from "./index.js";

const schema = z.object({
  query: z.string(),
});

async function searchGlifsHandler(
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const { query } = args as { query: string };
  const glifs = await searchGlifs({ q: query });
  const formattedGlifs = formatGlifSearchResults(glifs);

  return createTextResponse(
    `Search results for "${query}":\n\n${formattedGlifs}`
  );
}

// Export the tool using the factory pattern
export const {
  definition,
  handler,
  schema: exportedSchema,
} = createTool(
  {
    name: "search_glifs",
    description: "Search for glifs by query string",
    schema,
    properties: {
      query: {
        type: "string",
        description: "Search query string",
      },
    },
    required: ["query"],
  },
  searchGlifsHandler
);

// For backward compatibility
export { exportedSchema as schema };
