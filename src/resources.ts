import {
  ErrorCode,
  ListResourcesRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import axios from "axios";
import { GlifRunSchema, GlifSchema, UserSchema } from "./types.js";
import { getGlifDetails } from "./api.js";

export function setupResourceHandlers(server: Server) {
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
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
    ],
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
          const response = await axios.get(
            `https://glif.app/api/runs?id=${id}`
          );
          const run = GlifRunSchema.parse(response.data[0]);
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
          const response = await axios.get(`https://glif.app/api/users/${id}`);
          const user = UserSchema.parse(response.data);
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
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `API error: ${error.response?.data?.message ?? error.message}`
        );
      }
      throw error;
    }
  });
}
