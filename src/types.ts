import { z } from "zod";

// Bot related schemas
export const SimplifiedGlifSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    user: z
      .object({
        id: z.string(),
        name: z.string(),
        username: z.string(),
        image: z.string().url().nullable().optional(),
        isSubscriber: z.boolean().optional(),
      })
      .optional(),
    averageDuration: z.number().nullable().optional(),
    inputs: z.record(z.string()).optional(),
  })
  .passthrough();

export const BotSkillSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    displayName: z.string().optional(),
    description: z.string().nullable().optional(),
    customName: z.string().nullable().optional(),
    customDescription: z.string().nullable().optional(),
    usageInstructions: z.string().nullable().optional(),
    type: z.string().optional(), // Usually "skillGlif"
    spell: SimplifiedGlifSchema.optional(),
  })
  .passthrough();

export const BotSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    bio: z.string().nullable().optional(),
    userId: z.string().optional(),
    image: z.union([z.string().url(), z.string(), z.null()]).optional(),
    memory: z.string().nullable().optional(),
    personality: z.string().nullable().optional(),
    deployedAt: z
      .union([z.string().datetime(), z.string(), z.null()])
      .optional(),
    chatResponseGlifId: z.string().nullable().optional(),
    messageCount: z.number().nullable().optional(),
    conversationStarters: z.array(z.unknown()).nullable().optional(),
    createdAt: z.union([z.string().datetime(), z.string()]).optional(),
    updatedAt: z.union([z.string().datetime(), z.string()]).optional(),
    themeCss: z.string().nullable().optional(),
    user: z
      .object({
        id: z.string(),
        name: z.string(),
        username: z.string(),
        image: z.union([z.string().url(), z.string(), z.null()]).optional(),
      })
      .optional(),
    spellsForBot: z
      .array(
        z
          .object({
            spell: z
              .object({
                id: z.string(),
                name: z.string(),
              })
              .passthrough(),
            spellId: z.string().optional(),
            customName: z.string().nullable().optional(),
            customDescription: z.string().nullable().optional(),
            usageInstructions: z.string().nullable().optional(),
            nativeToolName: z.string().nullable().optional(),
          })
          .passthrough()
      )
      .nullable()
      .optional(),
  })
  .passthrough();

// Direct bot response schema (for single bot)
export const BotResponseSchema = BotSchema;

// Array of bots schema (for listing bots)
export const BotsListSchema = z.array(BotSchema);

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
export type BotResponse = z.infer<typeof BotResponseSchema>;
export type BotsList = z.infer<typeof BotsListSchema>;
