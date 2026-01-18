import { z } from 'zod';

export const IntervalSchema = z.object({
  type: z.enum(['warmup', 'work', 'cooldown', 'recovery']),
  distance: z.number().optional(),
  time: z.number().optional(), // seconds
  pace: z.number().optional(),
  avgHeartRate: z.number().optional(),
  note: z.string().optional(),
  repeats: z.number().optional(), // number of times to repeat this interval
});

export const WorkoutSetSchema = z.object({
  reps: z.number().optional(),
  weight: z.number().optional(), // kg
});

export const ExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.array(WorkoutSetSchema),
});

export const WorkoutSchema = z.object({
  _id: z.any().optional(), // MongoDB ObjectId
  groupId: z.string(), // MongoDB group _id
  userId: z.string(), // Clerk user ID
  type: z.string().min(1),
  duration: z.number().optional(), // minutes
  amount: z.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1),
    // Cardio fields
    calories: z.number().optional(),
    avgHeartRate: z.number().optional(),
    intervals: z.array(IntervalSchema).optional(),
    // Run-specific
    avgPace: z.number().optional(), // min/km
    // Bike-specific
    avgSpeed: z.number().optional(), // km/h
  // Swim-specific
  distancePer100m: z.number().optional(), // seconds per 100m
  laps: z.number().optional(),
  poolLength: z.number().optional(), // meters
  // Strength training
  exercises: z.array(ExerciseSchema).optional(),
  // Legacy field
  distance: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// TypeScript types
export type Interval = z.infer<typeof IntervalSchema>;
export type WorkoutSet = z.infer<typeof WorkoutSetSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;

// Helper to create a new workout
export const CreateWorkoutSchema = WorkoutSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateWorkoutInput = z.infer<typeof CreateWorkoutSchema>;
