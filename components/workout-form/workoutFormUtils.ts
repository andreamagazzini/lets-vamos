import { getTodayDateString, isDateInFuture } from '@/lib/date-utils';
import type { Exercise, Interval, Workout } from '@/lib/db';

export interface WorkoutFormState {
  type: string;
  duration: string;
  amount: string;
  unit: string;
  calories: string;
  avgHeartRate: string;
  notes: string;
  date: string;
  intervals: Interval[];
  avgSpeed: string;
  distancePer100m: string;
  laps: string;
  poolLength: string;
  exercises: Exercise[];
  // Legacy field for backward compatibility
  distance?: string;
}

export function validateWorkout(state: WorkoutFormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!state.type) {
    errors.type = 'Workout type is required';
  }

  // For all workout types, require at least one of: duration, amount, or notes
  if (!state.duration && !state.amount && !state.notes.trim()) {
    errors.duration = 'At least one of duration, amount, or notes is required';
    errors.amount = 'At least one of duration, amount, or notes is required';
  }
  // If amount is provided, unit should also be provided
  if (state.amount && !state.unit) {
    errors.unit = 'Unit is required when amount is provided';
  }

  if (!state.date) {
    errors.date = 'Date is required';
  } else if (isDateInFuture(state.date)) {
    errors.date = 'Date cannot be in the future';
  }

  return errors;
}

export function buildWorkoutData(
  state: WorkoutFormState,
  groupId: string,
  userId: string
): Omit<Workout, '_id' | 'createdAt'> {
  // Migrate legacy distance to amount/unit if needed
  let amount: number | undefined;
  let unit: string | undefined;
  if (state.amount) {
    amount = parseFloat(state.amount);
    unit = state.unit || undefined;
  } else if (state.distance) {
    // Backward compatibility: convert distance to amount/unit
    amount = parseFloat(state.distance);
    unit = 'km'; // Default unit for legacy distance
  }

  return {
    groupId,
    userId,
    type: state.type,
    duration: state.duration ? parseInt(state.duration, 10) : undefined,
    amount,
    unit,
    calories: state.calories ? parseInt(state.calories, 10) : undefined,
    avgHeartRate: state.avgHeartRate ? parseInt(state.avgHeartRate, 10) : undefined,
    notes: state.notes.trim() || undefined,
    date: state.date,
    intervals: state.intervals.length > 0 ? state.intervals : undefined,
    avgSpeed: state.avgSpeed ? parseFloat(state.avgSpeed) : undefined,
    distancePer100m: state.distancePer100m ? parseFloat(state.distancePer100m) : undefined,
    laps: state.laps ? parseInt(state.laps, 10) : undefined,
    poolLength: state.poolLength ? parseInt(state.poolLength, 10) : undefined,
    exercises:
      state.type === 'Strength' && state.exercises.length > 0 ? state.exercises : undefined,
    // Keep legacy distance for backward compatibility
    distance: state.distance ? parseFloat(state.distance) : undefined,
  };
}

export function initializeFormState(workout?: Workout | null): WorkoutFormState {
  if (workout) {
    // Migrate legacy distance to amount/unit if needed
    let amount = '';
    let unit = '';
    if (workout.amount !== undefined) {
      amount = workout.amount.toString();
      unit = workout.unit || '';
    } else if (workout.distance !== undefined) {
      // Backward compatibility: convert distance to amount/unit
      amount = workout.distance.toString();
      unit = 'km';
    }

    return {
      type: workout.type,
      duration: workout.duration?.toString() || '',
      amount,
      unit,
      calories: workout.calories?.toString() || '',
      avgHeartRate: workout.avgHeartRate?.toString() || '',
      notes: workout.notes || '',
      date: workout.date,
      intervals: workout.intervals || [],
      avgSpeed: workout.avgSpeed?.toString() || '',
      distancePer100m: workout.distancePer100m?.toString() || '',
      laps: workout.laps?.toString() || '',
      poolLength: workout.poolLength?.toString() || '',
      exercises: workout.exercises || [],
      distance: workout.distance?.toString() || '', // Keep for backward compatibility
    };
  }

  const today = getTodayDateString();
  return {
    type: 'Run',
    duration: '',
    amount: '',
    unit: '',
    calories: '',
    avgHeartRate: '',
    notes: '',
    date: today,
    intervals: [],
    avgSpeed: '',
    distancePer100m: '',
    laps: '',
    poolLength: '',
    exercises: [],
  };
}
