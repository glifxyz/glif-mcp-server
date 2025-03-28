import { z } from "zod";

// User schema
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().url().nullable(),
  username: z.string(),
  bio: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  banned: z.boolean().optional(),
  bannedAt: z.string().datetime().nullable().optional(),
  rateLimitClass: z.string().optional(),
  staff: z.boolean().optional(),
  isSubscriber: z.boolean().optional(),
});

// Glif schema
export const GlifSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().url().nullable(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
  output: z.string().nullable(),
  outputType: z.string().nullable(),
  forkedFromId: z.string().nullable(),
  featuredAt: z.string().datetime().nullable(),
  userId: z.string(),
  completedSpellRunCount: z.number().optional(),
  averageDuration: z.number().nullable(),
  likeCount: z.number().optional(),
  commentCount: z.number().optional(),
  user: UserSchema,
  spellTags: z.array(z.unknown()).optional(),
  spheres: z.array(z.unknown()).optional(),
  data: z
    .object({
      nodes: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          params: z
            .object({
              label: z.string().optional(),
            })
            .and(z.record(z.unknown())),
        })
      ),
    })
    .optional(),
});

// Glif run schema
export const GlifRunSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  output: z.string().nullable(),
  outputType: z.string().nullable(),
  userId: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  totalDuration: z.number().nullable(),
  public: z.boolean().optional(),
  clientType: z.string().optional(),
  inputs: z.record(z.unknown()).optional(),
  spellId: z.string(),
  outputImageWidth: z.number().nullable(),
  outputImageHeight: z.number().nullable(),
  deletionReason: z.string().nullable(),
  deleted: z.boolean().optional(),
  totalSellingPriceCredits: z.string().nullable().optional(),
  likeCount: z.number().optional(),
  commentCount: z.number().optional(),
  visibility: z.string().optional(),
  user: UserSchema,
  spell: z.object({
    id: z.string(),
    name: z.string(),
    output: z.string().nullable(),
    outputType: z.string().nullable(),
    user: UserSchema.optional(),
  }),
});

// Glif run response schema
export const GlifRunResponseSchema = z.object({
  id: z.string(),
  inputs: z.record(z.string()),
  output: z.string(),
  outputFull: z
    .object({
      type: z.string(),
    })
    .and(z.record(z.unknown())),
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type Glif = z.infer<typeof GlifSchema>;
export type GlifRun = z.infer<typeof GlifRunSchema>;
export type GlifRunResponse = z.infer<typeof GlifRunResponseSchema>;

// Search params schema
export const SearchParamsSchema = z.object({
  q: z.string().optional(),
  featured: z.boolean().optional(),
  id: z.string().optional(),
});

// Me response schema
export const MeResponseSchema = z.object({
  user: UserSchema,
  credits: z.object({
    remaining: z.number(),
    limit: z.number(),
    label: z.string(),
  }),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
};
