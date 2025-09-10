import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ErrorCode,
  ListResourcesRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getGlifDetails, glifApi } from "./api.js";
import { GlifRunSchema, UserSchema } from "./types.js";
import {
  handleApiError,
  handleUnauthorized,
  validateWithSchema,
} from "./utils/utils.js";

/**
 * Available resource types
 */
const RESOURCES = [
  {
    uri: "glif://template",
    name: "Glif Details",
    description: "Get metadata about a specific glif",
    uriTemplate: "glif://{id}",
  },
  {
    uri: "glifRun://template",
    name: "Glif Run Details",
    description: "Get details about a specific glif run",
    uriTemplate: "glifRun://{id}",
  },
  {
    uri: "glifUser://template",
    name: "Glif User Details",
    description: "Get details about a glif user",
    uriTemplate: "glifUser://{id}",
  },
];

export function setupResourceHandlers(server: Server) {
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCES,
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = new URL(request.params.uri);
    const id = uri.hostname;

    try {
      switch (uri.protocol) {
        case "glif:": {
          const { glif } = await getGlifDetails(id);
          return {
            contents: [
              {
                uri: request.params.uri,
                text: JSON.stringify(glif, null, 2),
              },
            ],
          };
        }
        case "glifRun:": {
          const data = await glifApi
            .url("/runs")
            .query({ id })
            .get()
            .unauthorized(handleUnauthorized)
            .json<unknown[]>();

          const run = validateWithSchema(
            GlifRunSchema,
            data[0],
            "glifRun resource validation"
          );

          return {
            contents: [
              {
                uri: request.params.uri,
                text: JSON.stringify(run, null, 2),
              },
            ],
          };
        }
        case "glifUser:": {
          const data = await glifApi
            .url(`/users/${id}`)
            .get()
            .unauthorized(handleUnauthorized)
            .json<unknown>();

          const user = validateWithSchema(
            UserSchema,
            data,
            "glifUser resource validation"
          );

          return {
            contents: [
              {
                uri: request.params.uri,
                text: JSON.stringify(user, null, 2),
              },
            ],
          };
        }
        default:
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Unsupported protocol: ${uri.protocol}`
          );
      }
    } catch (error) {
      return handleApiError(error, `Reading resource ${request.params.uri}`);
    }
  });
}
