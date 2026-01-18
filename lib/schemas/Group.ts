import { z } from 'zod';

// Schema definitions for validation
export const GroupPlanSettingsSchema = z.object({
  displayStyle: z.enum(['compact', 'expanded', 'detailed']).default('expanded'),
  showIcons: z.boolean().default(true),
  showDetails: z.boolean().default(true),
  colorTheme: z.enum(['default', 'minimal', 'vibrant']).default('default'),
  highlightToday: z.boolean().default(true),
});

export const PlannedWorkoutSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
  duration: z.number().optional(),
  amount: z.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export const WeeklyPlanSchema = z.record(
  z.string(),
  z.array(z.union([z.string(), PlannedWorkoutSchema]))
);

export const WeeklyPlanOverridesSchema = z.record(z.string(), WeeklyPlanSchema);

export const GroupSchema = z.object({
  _id: z.any().optional(), // MongoDB ObjectId (used as groupId)
  name: z.string().min(1),
  emoji: z.string().optional(),
  backgroundImage: z.string().optional(),
  goalType: z.string().min(1),
  goalDate: z.string().min(1),
  inviteCode: z.string().min(1),
  createdBy: z.string(), // Clerk userId of the creator
  trainingPlan: WeeklyPlanSchema.default({}),
  weeklyPlanOverrides: WeeklyPlanOverridesSchema.optional(),
  planSettings: GroupPlanSettingsSchema.optional(),
  workoutTypes: z.array(z.string()).optional(),
  deletedAt: z.date().optional(), // Soft delete timestamp
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// TypeScript types inferred from schemas
export type GroupPlanSettings = z.infer<typeof GroupPlanSettingsSchema>;
export type PlannedWorkout = z.infer<typeof PlannedWorkoutSchema>;
export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;
export type WeeklyPlanOverrides = z.infer<typeof WeeklyPlanOverridesSchema>;
export type Group = z.infer<typeof GroupSchema>;

// Helper to create a new group (without _id, timestamps, deletedAt)
export const CreateGroupSchema = GroupSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
