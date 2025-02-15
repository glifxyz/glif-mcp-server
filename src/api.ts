import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import type { WretchError } from "wretch";
import { z } from "zod";
import {
  GlifRunResponseSchema,
  GlifSchema,
  GlifRunSchema,
  SearchParamsSchema,
  UserSchema,
  type Glif,
  type GlifRun,
  type GlifRunResponse,
  type User,
} from "./types.js";

const API_TOKEN = process.env.GLIF_API_TOKEN;
if (!API_TOKEN) {
  throw new Error("GLIF_API_TOKEN environment variable is required");
}

export const api = wretch()
  .addon(QueryStringAddon)
  .headers({
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  })
  .errorType("json");

const simpleApi = api.url("https://simple-api.glif.app");
const glifApi = api.url("https://glif.app/api");

export async function runGlif(
  id: string,
  inputs: string[]
): Promise<GlifRunResponse> {
  try {
    const data = await simpleApi
      .post({ id, inputs })
      .unauthorized((err: WretchError) => {
        console.error("Unauthorized request:", err);
        throw err;
      })
      .json();

    return GlifRunResponseSchema.parse(data);
  } catch (error) {
    console.error("Error running glif:", error);
    throw error;
  }
}

export async function searchGlifs(
  params: z.infer<typeof SearchParamsSchema>
): Promise<Glif[]> {
  try {
    const queryParams: Record<string, string> = {};
    if (params.q) queryParams.q = params.q;
    if (params.featured) queryParams.featured = "1";
    if (params.id) queryParams.id = params.id;

    const data = await glifApi
      .url("/glifs")
      .query(queryParams)
      .get()
      .unauthorized((err: WretchError) => {
        console.error("Unauthorized request:", err);
        throw err;
      })
      .json();

    return z.array(GlifSchema).parse(data);
  } catch (error) {
    console.error("Error searching glifs:", error);
    throw error;
  }
}

export async function getGlifDetails(id: string): Promise<{
  glif: Glif;
  recentRuns: GlifRun[];
}> {
  try {
    const [glifData, runsData] = await Promise.all([
      glifApi
        .url("/glifs")
        .query({ id })
        .get()
        .unauthorized((err: WretchError) => {
          console.error("Unauthorized request:", err);
          throw err;
        })
        .json(),
      glifApi
        .url("/runs")
        .query({ glifId: id })
        .get()
        .unauthorized((err: WretchError) => {
          console.error("Unauthorized request:", err);
          throw err;
        })
        .json(),
    ]);

    const glif = z.array(GlifSchema).parse(glifData)[0];
    const recentRuns = z.array(GlifRunSchema).parse(runsData).slice(0, 3);

    return { glif, recentRuns };
  } catch (error) {
    console.error(
      "Error fetching glif details:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
}

let cachedUserId: string | null = null;

export async function getMyUserInfo() {
  try {
    const data = await glifApi
      .url("/me")
      .get()
      .unauthorized((err: WretchError) => {
        console.error("Unauthorized request:", err);
        throw err;
      })
      .json();

    const user = UserSchema.parse(data);
    cachedUserId = user.id;
    return user;
  } catch (error) {
    console.error("Error fetching user info:", error);
    throw error;
  }
}

export async function getMyRecentRuns(): Promise<GlifRun[]> {
  try {
    const userId = cachedUserId ?? (await getMyUserInfo()).id;
    const data = await glifApi
      .url("/runs")
      .query({ userId })
      .get()
      .unauthorized((err: WretchError) => {
        console.error("Unauthorized request:", err);
        throw err;
      })
      .json();

    return z.array(GlifRunSchema).parse(data);
  } catch (error) {
    console.error("Error fetching user's recent runs:", error);
    throw error;
  }
}

export async function getMyGlifs(): Promise<Glif[]> {
  try {
    const userId = cachedUserId ?? (await getMyUserInfo()).id;
    const data = await glifApi
      .url("/glifs")
      .query({ userId })
      .get()
      .unauthorized((err: WretchError) => {
        console.error("Unauthorized request:", err);
        throw err;
      })
      .json();

    return z.array(GlifSchema).parse(data);
  } catch (error) {
    console.error("Error fetching user's glifs:", error);
    throw error;
  }
}

// TODO: Endpoint not yet available
// export async function getMyLikedGlifs(userId: string): Promise<Glif[]> {
//   try {
//     const data = await glifApi
//       .url("/glifs/liked")
//       .query({ userId })
//       .get()
//       .unauthorized((err: WretchError) => {
//         console.error("Unauthorized request:", err);
//         throw err;
//       })
//       .json();
//
//     return z.array(GlifSchema).parse(data);
//   } catch (error) {
//     console.error("Error fetching user's liked glifs:", error);
//     throw error;
//   }
// }

export async function createGlif(
  name: string,
  description: string
): Promise<Glif> {
  // TODO: Coming soon!
  throw new Error("Create glif functionality coming soon!");
}

export function formatOutput(type: string, output: string): string {
  switch (type) {
    case "IMAGE":
      return `[Image] ${output}`;
    case "VIDEO":
      return `[Video] ${output}`;
    case "AUDIO":
      return `[Audio] ${output}`;
    default:
      return output;
  }
}
