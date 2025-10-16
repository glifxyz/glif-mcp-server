import { z } from "zod";
import { searchGlifs } from "../api.js";
import { formatFeaturedGlifs } from "../utils/glif-formatting.js";
import { createTextResponse, createTool } from "../utils/tool-factory.js";
import type { ToolResponse } from "./index.js";

const schema = z.object({});

async function listFeaturedGlifsHandler(): Promise<ToolResponse> {
  const glifs = await searchGlifs({ featured: true });
  const formattedGlifs = formatFeaturedGlifs(glifs);

  return createTextResponse(`Featured glifs:\n\n${formattedGlifs}`);
}

// Export the tool using the factory pattern
export const {
  definition,
  handler,
  schema: exportedSchema,
} = createTool(
  {
    name: "list_featured_glifs",
    description: "Get a curated list of featured glifs",
    schema,
    properties: {},
    required: [],
    annotations: {
      title: "List Featured Glifs",
      readOnlyHint: true,
    },
  },
  listFeaturedGlifsHandler
);

// For backward compatibility
export { exportedSchema as schema };
