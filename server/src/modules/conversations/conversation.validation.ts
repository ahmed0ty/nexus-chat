import { z } from "zod";

export const createConversationSchema = z.object({
  type: z.enum(["direct", "group", "channel"]),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  participantIds: z.array(z.string()).min(1).max(999),
  isPublic: z.boolean().optional().default(false),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;