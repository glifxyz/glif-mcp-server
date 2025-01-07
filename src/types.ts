import { z } from "zod";

// User schema
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().url(),
  username: z.string(),
});

// Glif schema
export const GlifSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().url().nullable(),
  description: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
  output: z.string().nullable(),
  outputType: z.string(),
  forkedFromId: z.string().nullable(),
  featuredAt: z.string().datetime().nullable(),
  userId: z.string(),
  completedSpellRunCount: z.number(),
  averageDuration: z.number(),
  likeCount: z.number(),
  commentCount: z.number(),
  user: UserSchema,
  spellTags: z.array(z.unknown()),
  spheres: z.array(z.unknown()),
  data: z.object({
    nodes: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        params: z.record(z.unknown()),
      })
    ),
  }),
});

// Glif run schema
export const GlifRunSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  output: z.string(),
  outputType: z.string(),
  userId: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  totalDuration: z.number(),
  public: z.boolean(),
  clientType: z.string(),
  inputs: z.record(z.unknown()),
  spellId: z.string(),
  outputImageWidth: z.number().nullable(),
  outputImageHeight: z.number().nullable(),
  deletionReason: z.string().nullable(),
  deleted: z.boolean(),
  totalSellingPriceCredits: z.string(),
  likeCount: z.number(),
  commentCount: z.number(),
  visibility: z.string(),
  user: UserSchema,
  spell: z.object({
    id: z.string(),
    name: z.string(),
    output: z.string(),
    outputType: z.string(),
    user: UserSchema,
  }),
});

// Glif run response schema
export const GlifRunResponseSchema = z.object({
  id: z.string(),
  inputs: z.record(z.string()),
  output: z.string(),
  outputFull: z.record(z.unknown()),
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

export type SearchParams = z.infer<typeof SearchParamsSchema>;
