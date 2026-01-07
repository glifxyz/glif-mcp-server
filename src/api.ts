import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import { z } from "zod";
import {
  type Bot,
  BotResponseSchema,
  BotsListSchema,
  type Glif,
  type GlifRun,
  type GlifRunResponse,
  GlifRunResponseSchema,
  GlifRunSchema,
  GlifSchema,
  MeResponseSchema,
  type SearchParamsSchema,
  type User,
} from "./types.js";
import {
  handleApiError,
  handleUnauthorized,
  logger,
  validateWithSchema,
} from "./utils/utils.js";

const API_TOKEN = process.env.GLIF_API_TOKEN;
if (!API_TOKEN) {
  throw new Error("GLIF_API_TOKEN environment variable is required");
}

export const api = wretch()
  .addon(QueryStringAddon)
  .headers({
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  });

export const simpleApi = api.url("https://simple-api.glif.app");
export const glifApi = api.url("https://glif.app/api");

/**
 * Generic API request function to reduce code duplication
 */
async function apiRequest<T>(
  endpoint: string,
  method: "get" | "post",
  options: {
    baseApi?: typeof glifApi | typeof simpleApi;
    queryParams?: Record<string, string>;
    body?: unknown;
    schema?: z.ZodType<T>;
    context?: string;
  } = {}
): Promise<T> {
  const {
    baseApi = glifApi,
    queryParams = {},
    body,
    schema,
    context = `${method} ${endpoint}`,
  } = options;

  try {
    let request = baseApi.url(endpoint);

    if (Object.keys(queryParams).length > 0) {
      request = request.query(queryParams);
    }
    logger.info("apiRequest", { endpoint, method, queryParams, body });

    let response: unknown;
    switch (method) {
      case "get":
        response = await request.get().unauthorized(handleUnauthorized).json();
        logger.info("GET response =>", response);
        break;
      case "post":
        response = await request
          .post(body)
          .unauthorized(handleUnauthorized)
          .json();
        logger.info("POST response =>", response);
        break;
    }

    return schema
      ? validateWithSchema(schema, response, context)
      : (response as T);
  } catch (error) {
    return handleApiError(error, context);
  }
}

export async function runGlif(
  id: string,
  inputs: string[]
): Promise<GlifRunResponse> {
  return apiRequest<GlifRunResponse>("", "post", {
    baseApi: simpleApi,
    body: { id, inputs },
    schema: GlifRunResponseSchema,
    context: "runGlif",
  });
}

export async function searchGlifs(
  params: z.infer<typeof SearchParamsSchema>
): Promise<Glif[]> {
  const queryParams: Record<string, string> = {};
  if (params.q) queryParams.q = params.q;
  if (params.featured) queryParams.featured = "1";
  if (params.id) queryParams.id = params.id;

  logger.debug("searchGlifs", { queryParams });

  return apiRequest<Glif[]>("/glifs", "get", {
    queryParams,
    schema: z.array(GlifSchema),
    context: "searchGlifs",
  });
}

export async function getGlifDetails(id: string): Promise<{
  glif: Glif;
  recentRuns: GlifRun[];
}> {
  logger.debug("getGlifDetails", { id });

  try {
    const [glifData, runsData] = await Promise.all([
      apiRequest<unknown>("/glifs", "get", {
        queryParams: { id },
        context: "getGlifDetails - glifs",
      }),
      apiRequest<unknown>("/runs", "get", {
        queryParams: { glifId: id },
        context: "getGlifDetails - runs",
      }),
    ]);

    const glifArray = validateWithSchema(
      z.array(GlifSchema),
      glifData,
      "getGlifDetails - glifs validation"
    );
    const glif = glifArray[0];
    if (!glif) {
      throw new Error("No glif found in response");
    }

    const recentRuns = validateWithSchema(
      z.array(GlifRunSchema),
      runsData,
      "getGlifDetails - runs validation"
    ).slice(0, 3);

    return { glif, recentRuns };
  } catch (error) {
    return handleApiError(error, "getGlifDetails");
  }
}

let cachedUserId: string | null = null;

export async function getMyUserInfo(): Promise<User> {
  logger.debug("getMyUserInfo");

  const data = await apiRequest<unknown>("/me", "get", {
    context: "getMyUserInfo",
  });

  const response = validateWithSchema(
    MeResponseSchema,
    data,
    "getMyUserInfo validation"
  );

  const user = response.user;
  cachedUserId = user.id;
  logger.debug("getMyUserInfo:response", user);

  return user;
}

export async function getMyRecentRuns(): Promise<GlifRun[]> {
  const userId = cachedUserId ?? (await getMyUserInfo()).id;
  logger.debug("getMyRecentRuns", { userId });

  return apiRequest<GlifRun[]>("/runs", "get", {
    queryParams: { userId },
    schema: z.array(GlifRunSchema),
    context: "getMyRecentRuns",
  });
}

export async function getMyGlifs(): Promise<Glif[]> {
  const userId = cachedUserId ?? (await getMyUserInfo()).id;
  logger.debug("getMyGlifs", { userId });

  return apiRequest<Glif[]>("/glifs", "get", {
    queryParams: { userId },
    schema: z.array(GlifSchema),
    context: "getMyGlifs",
  });
}

// TODO: Endpoint not yet available
// export async function getMyLikedGlifs(userId: string): Promise<Glif[]> {
//   return apiRequest<Glif[]>("/glifs/liked", "get", {
//     queryParams: { userId },
//     schema: z.array(GlifSchema),
//     context: "getMyLikedGlifs",
//   });
// }

export async function createGlif(): Promise<Glif> {
  // TODO: Coming soon!
  throw new Error("Create glif functionality coming soon!");
}

export async function getBots(params: {
  id?: string;
  sort?: "new" | "popular" | "featured";
  searchQuery?: string;
  creator?: string;
}): Promise<Bot | Bot[]> {
  const queryParams: Record<string, string> = {};

  if (params.id) queryParams.id = params.id;
  if (params.sort) queryParams.sort = params.sort;
  if (params.searchQuery) queryParams.searchQuery = params.searchQuery;
  if (params.creator) queryParams.creator = params.creator;

  logger.debug("getBots", { queryParams });

  const data = await apiRequest<unknown>("/bots", "get", {
    queryParams,
    context: "getBots",
  });
  logger.debug("response => ", data);

  // If id is provided, return a single bot
  if (params.id) {
    return validateWithSchema(BotResponseSchema, data, "getBots - single bot");
  } else {
    // Otherwise, return an array of bots
    return validateWithSchema(BotsListSchema, data, "getBots - bot list");
  }
}

export async function listBots(
  params: {
    sort?: "new" | "popular" | "featured";
    searchQuery?: string;
    creator?: string;
  } = {}
): Promise<Bot[]> {
  logger.info("listBots", { params });
  const result = await getBots(params);
  return Array.isArray(result) ? result : [result];
}

export async function loadBot(id: string): Promise<Bot> {
  const result = await getBots({ id });
  if (Array.isArray(result)) {
    const bot = result[0];
    if (!bot) {
      throw new Error("No bot found");
    }
    return bot;
  }
  return result;
}

export function searchBots(query: string) {
  return getBots({ searchQuery: query });
}
