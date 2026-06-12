import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(200).optional(),
});

export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.enum(["ar", "en", "es", "de"]).optional(),
  notifications: z.object({
    sound: z.boolean().optional(),
    desktop: z.boolean().optional(),
    doNotDisturb: z.boolean().optional(),
    doNotDisturbUntil: z.string().datetime().optional(),
  }).optional(),
  privacy: z.object({
    lastSeen: z.enum(["everyone", "contacts", "nobody"]).optional(),
    readReceipts: z.boolean().optional(),
    disappearingMessages: z.number().optional(),
  }).optional(),
  chatTheme: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;