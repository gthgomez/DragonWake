/**
 * Request-body validation at API boundary (P0.6).
 * Zod schemas for critical POST bodies → 400 with code VALIDATION.
 */
import { z } from "zod";
import { canonResourceBag, isKnownResourceId } from "@dragonwake/content";

const inboundResourceBagSchema = z
  .record(z.string(), z.number().finite().min(0).max(Number.MAX_SAFE_INTEGER))
  .superRefine((bag, ctx) => {
    for (const key of Object.keys(bag)) {
      if (!isKnownResourceId(key)) {
        ctx.addIssue({ code: "custom", path: [key], message: "unknown resource id" });
      }
    }
  })
  .transform((bag) => canonResourceBag(bag));

export const guestBodySchema = z.object({
  displayName: z.string().trim().min(1).max(32).optional(),
  faction: z
    .enum(["northern_kingdom", "mountain_realm", "forest_people", "coastal_lords"])
    .optional(),
});

export const buildBodySchema = z.object({
  slotIndex: z.number().int().min(0).max(32),
  buildingType: z.string().min(1).max(64),
});

export const researchBodySchema = z.object({
  techId: z.string().min(1).max(64),
});

export const trainBodySchema = z.object({
  unitId: z.string().min(1).max(64),
  count: z.number().int().min(1).max(50_000),
});

export const postureBodySchema = z.object({
  posture: z.enum(["withdraw", "garrison", "full"]),
});

export const marchBodySchema = z.object({
  fromCityId: z.string().uuid(),
  intent: z.enum(["scout", "attack", "occupy", "reinforce", "haul"]),
  target: z.object({
    type: z.enum(["camp", "wilderness", "city", "coords"]),
    id: z.string().uuid().optional(),
    x: z.number().int().min(0).max(1000),
    y: z.number().int().min(0).max(1000),
  }),
  composition: z.record(z.string(), z.number().int().min(0).max(1_000_000)).default({}),
  cargo: inboundResourceBagSchema.optional(),
  commanderId: z.string().uuid().optional(),
});

export const chatBodySchema = z.object({
  body: z.string().trim().min(1).max(500),
});

export const allianceCreateSchema = z.object({
  name: z.string().trim().min(1).max(48),
  tag: z.string().trim().min(2).max(8),
});

export const allianceJoinSchema = z
  .object({
    allianceId: z.string().uuid().optional(),
    tag: z.string().trim().min(2).max(8).optional(),
  })
  .refine((v) => v.allianceId || v.tag, {
    message: "allianceId or tag required",
  });

export const hatchlingNameSchema = z.object({
  name: z.string().trim().min(2).max(24),
});

export const dragonIdSchema = z.object({
  dragonId: z.string().uuid(),
});

export const harnessSchema = z.object({
  dragonId: z.string().uuid(),
  role: z.enum(["yard", "home_guard"]),
});

export const scarEncounterSchema = z.object({
  composition: z.record(z.string(), z.number().int().min(0).max(1_000_000)).default({}),
});

export const knowledgeCodifySchema = z.object({
  questionId: z.enum(["vane_reading", "fen_silt"]),
});

export const stationSchema = z.object({
  where: z.enum(["ford", "home"]),
});

export const adminGrantSchema = z.object({
  resources: inboundResourceBagSchema.optional(),
  units: z.record(z.string(), z.number().int().min(0)).optional(),
  chronite: z.number().int().min(0).optional(),
  skipProtection: z.boolean().optional(),
  brineholdUnlock: z.boolean().optional(),
  stonekeelUnlock: z.boolean().optional(),
  citadelUnlock: z.string().max(64).optional(),
  items: z.record(z.string(), z.number()).optional(),
  dragonCounters: z
    .object({
      camps: z.number().optional(),
      scouts: z.number().optional(),
      campTypes: z.array(z.string().max(64)).optional(),
    })
    .optional(),
  bestiaryEncounters: z.record(z.string(), z.number()).optional(),
});

export type ParseOk<T> = { ok: true; data: T };
export type ParseFail = {
  ok: false;
  code: "VALIDATION";
  message: string;
  issues: string[];
};

export function parseBody<T>(
  schema: z.ZodType<T>,
  raw: unknown,
): ParseOk<T> | ParseFail {
  const result = schema.safeParse(raw);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issues = result.error.issues.map(
    (i) => `${i.path.join(".") || "body"}: ${i.message}`,
  );
  return {
    ok: false,
    code: "VALIDATION",
    message: issues[0] ?? "invalid body",
    issues,
  };
}
