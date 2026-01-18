import { z } from 'zod';

export const MemberSchema = z.object({
  _id: z.any().optional(), // MongoDB ObjectId
  groupId: z.string(), // MongoDB group _id
  userId: z.string(), // Clerk user ID
  displayName: z.string(), // Required display name (group-specific or from Clerk)
  role: z.enum(['admin', 'member']).default('member'),
  createdAt: z.date().optional(), // When the member joined (record creation time)
  updatedAt: z.date().optional(),
});

// TypeScript types inferred from schemas
export type Member = z.infer<typeof MemberSchema>;

// Helper to create a new member (without _id, timestamps)
export const CreateMemberSchema = MemberSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateMemberInput = z.infer<typeof CreateMemberSchema>;
