// Shared constants across the application

export const DEFAULT_WORKOUT_TYPES = ['Run', 'Bike', 'Swim', 'Strength', 'Rest'] as const;

export type WorkoutType = (typeof DEFAULT_WORKOUT_TYPES)[number];

// Common units for workouts (distance/amount units only, not time/calories)
export const COMMON_UNITS = ['km', 'miles', 'm', 'reps', 'sets', 'steps', 'laps'] as const;

export type Unit = (typeof COMMON_UNITS)[number];

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export type DayOfWeek = (typeof DAYS)[number];

export const GOAL_TYPES = [
  'Marathon',
  'Half-Marathon',
  'Hyrox',
  'Triathlon',
  'Cycling',
  'Other',
] as const;

export type GoalType = (typeof GOAL_TYPES)[number];

export const DISPLAY_STYLES = ['compact', 'expanded', 'detailed'] as const;

export const COLOR_THEMES = ['default', 'minimal', 'vibrant'] as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  GENERIC: 'Something went wrong. Please try again.',
  DB_ERROR: 'Database error. Please refresh the page and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  GROUP_CREATED: 'Group created successfully!',
  WORKOUT_LOGGED: 'Workout logged successfully!',
  WORKOUT_UPDATED: 'Workout updated successfully!',
  WORKOUT_DELETED: 'Workout deleted successfully!',
  MEMBER_JOINED: 'Successfully joined the group!',
  PLAN_UPDATED: 'Training plan updated successfully!',
} as const;
