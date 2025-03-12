import { z } from "zod";

// Bot related schemas
export const SimplifiedGlifSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    image: z.string().url().nullable(),
    isSubscriber: z.boolean().optional(),
  }),
  averageDuration: z.number().nullable(),
  inputs: z.record(z.string()).optional(),
});

export const BotSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  customName: z.string().nullable(),
  customDescription: z.string().nullable(),
  usageInstructions: z.string().nullable(),
  type: z.string(), // Usually "skillGlif"
  spell: SimplifiedGlifSchema,
});

export const BotSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  bio: z.string().nullable(),
  image: z.string().url().nullable(),
  userId: z.string(),
  memory: z.string().nullable(),
  personality: z.string().nullable(),
  themeCss: z.string().nullable(),
  messageCount: z.number().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    image: z.string().url().nullable(),
  }),
  skills: z.array(BotSkillSchema).optional(),
});

export const BotListResponseSchema = z.object({
  result: z.object({
    data: z.object({
      json: z.array(
        z.object({
          type: z.string(),
          data: z.union([
            BotSchema,
            z.object({}).passthrough(), // For sim templates or other types
          ]),
          featured: z.boolean().optional(),
          featuredOrder: z.number().optional(),
        })
      ),
    }),
  }),
});

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
              label: z.string().nullable().optional(),
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

// Bot types
export type Bot = z.infer<typeof BotSchema>;
export type BotSkill = z.infer<typeof BotSkillSchema>;
export type BotListResponse = z.infer<typeof BotListResponseSchema>;
