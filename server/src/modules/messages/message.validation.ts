import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  type: z.enum([
    "text", "image", "video", "audio", "voice_note",
    "file", "sticker", "gif", "emoji_only", "location",
    "reply", "forward", "system",
  ]),
  content: z.string().max(10000).optional().default(""),
  replyTo: z.string().optional(),
  mentions: z.array(z.string()).optional().default([]),
  scheduledAt: z.string().datetime().optional(),
  disappearsAt: z.string().datetime().optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const translateMessageSchema = z.object({
  targetLang: z.enum(["ar", "en", "es", "de"]),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;