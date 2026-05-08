import { z } from 'zod'

// ─── Request schemas ──────────────────────────────────────────────────────────

/** Client fingerprint: stable device identifier (ANDROID_ID / UID) */
export const FingerprintSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid fingerprint characters')

/** Client timestamp (unix ms) */
export const TimestampSchema = z.number().int().positive()

export const VerifyRequestSchema = z.object({
  key_code: z
    .string()
    .min(1, '卡密不能为空')
    .max(64),
  fingerprint: FingerprintSchema.optional(),
  timestamp: TimestampSchema.optional(),   // client-side clock
  signature: z.string().length(64).regex(/^[a-f0-9]+$/).optional(),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

const LicenseDataSchema = z.object({
  activated_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  remaining_days: z.number().int().min(0),
})

export const VerifySuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: LicenseDataSchema,
})

export const VerifyErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  data: z.unknown().optional(),
})

export const AnnouncementSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  content: z.string(),
  created_at: z.string().datetime(),
})

export const AnnouncementListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(AnnouncementSchema),
})

// ─── Type inference ───────────────────────────────────────────────────────────

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>
export type VerifySuccessResponse = z.infer<typeof VerifySuccessResponseSchema>
export type VerifyErrorResponse = z.infer<typeof VerifyErrorResponseSchema>
export type AnnouncementListResponse = z.infer<typeof AnnouncementListResponseSchema>
