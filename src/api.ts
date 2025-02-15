import axios from "axios";
import { z } from "zod";
import {
  GlifRunResponseSchema,
  GlifSchema,
  GlifRunSchema,
  SearchParamsSchema,
  type Glif,
  type GlifRun,
  type GlifRunResponse,
} from "./types.js";

const API_TOKEN = process.env.GLIF_API_TOKEN;
if (!API_TOKEN) {
  throw new Error("GLIF_API_TOKEN environment variable is required");
}

const axiosInstance = axios.create({
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

export async function runGlif(
  id: string,
  inputs: string[]
): Promise<GlifRunResponse> {
  try {
    const response = await axiosInstance.post("https://simple-api.glif.app", {
      id,
      inputs,
    });

    return GlifRunResponseSchema.parse(response.data);
  } catch (error) {
    console.error("Error running glif:", error);
    throw error;
  }
}

export async function searchGlifs(
  params: z.infer<typeof SearchParamsSchema>
): Promise<Glif[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.set("q", params.q);
    if (params.featured) queryParams.set("featured", "1");
    if (params.id) queryParams.set("id", params.id);

    const url = `https://glif.app/api/glifs${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    const response = await axios.get(url);

    return z.array(GlifSchema).parse(response.data);
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
    const [glifResponse, runsResponse] = await Promise.all([
      axios.get(`https://glif.app/api/glifs?id=${id}`),
      axios.get(`https://glif.app/api/runs?glifId=${id}`),
    ]);

    const glif = z.array(GlifSchema).parse(glifResponse.data)[0];
    const recentRuns = z
      .array(GlifRunSchema)
      .parse(runsResponse.data)
      .slice(0, 3);

    return { glif, recentRuns };
  } catch (error) {
    console.error(
      "Error fetching glif details:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
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
