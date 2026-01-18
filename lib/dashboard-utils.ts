import { DAYS, DEFAULT_WORKOUT_TYPES } from './constants';
import {
  formatDateForDisplay,
  getAdjacentWeekKey,
  getDaysUntilGoal,
  getWeekKey,
  getWeekRange,
} from './date-utils';
import type { Group, PlannedWorkout, WeeklyPlan, Workout } from './db';

/**
 * Get workout types for a group (merges custom types with defaults)
 */
export function getWorkoutTypes(group: Group | null): string[] {
  const defaultTypes = [...DEFAULT_WORKOUT_TYPES];

  if (group?.workoutTypes && group.workoutTypes.length > 0) {
    // Merge custom types with defaults, avoiding duplicates
    const customTypes = group.workoutTypes.filter((t) => !(defaultTypes as string[]).includes(t));
    return [...defaultTypes, ...customTypes];
  }

  return defaultTypes;
}

// Re-export for backward compatibility
export { DAYS, getWeekKey, getWeekRange, getAdjacentWeekKey, getDaysUntilGoal };

/**
 * Get the plan for a specific week
 * Checks weeklyPlanOverrides first, then falls back to default trainingPlan
 */
export function getWeekPlan(group: Group | null, weekKey?: string): WeeklyPlan {
  if (!group?.trainingPlan) return {};

  const key = weekKey || getWeekKey();

  // Check if there's an override for this week
  if (group.weeklyPlanOverrides?.[key]) {
    return group.weeklyPlanOverrides[key];
  }

  // Return default plan
  return group.trainingPlan;
}

export function getCurrentWeekPlan(
  group: Group | null
): Record<string, (string | PlannedWorkout)[]> {
  const weekPlan = getWeekPlan(group);
  const plan: Record<string, (string | PlannedWorkout)[]> = {};
  DAYS.forEach((day) => {
    plan[day] = weekPlan[day] || [];
  });
  return plan;
}

export function isPlannedWorkout(workout: string | PlannedWorkout): workout is PlannedWorkout {
  return typeof workout === 'object' && workout !== null && 'type' in workout;
}

export function formatPlannedWorkout(
  workout: string | PlannedWorkout,
  settings?: { showDetails?: boolean }
): string {
  if (typeof workout === 'string') {
    return workout;
  }

  const parts: string[] = [workout.type];
  if (workout.description) {
    parts.push(workout.description);
  }
  if (settings?.showDetails) {
    if (workout.duration) {
      parts.push(`${workout.duration} min`);
    }
    // Legacy field - use amount/unit instead
    const legacyWorkout = workout as PlannedWorkout & { distance?: number };
    if (legacyWorkout.distance) {
      parts.push(`${legacyWorkout.distance} km`);
    }
  }
  return parts.join(' - ');
}

/**
 * Format a workout for display in the calendar grid (with intervals and exercises)
 * Used in setup-plan and edit-plan pages
 */
export function formatWorkoutForCalendar(workout: string | PlannedWorkout): string {
  if (typeof workout === 'string') {
    return workout;
  }

  let workoutText = workout.type;
  if (workout.amount) {
    workoutText += ` ${workout.amount}${workout.unit || 'km'}`;
  }
  if (workout.duration) {
    workoutText += ` (${workout.duration}min)`;
  }
  if (workout.intervals && workout.intervals.length > 0) {
    // Format intervals with repeats
    const intervalParts: string[] = [];
    const workoutType = workout.type;

    workout.intervals.forEach((interval, idx) => {
      const parts: string[] = [];

      // For recovery intervals after a repeated work interval, show as ", time break"
      if (interval.type === 'recovery' && idx > 0) {
        const prevInterval = workout.intervals?.[idx - 1];
        if (prevInterval?.repeats && prevInterval.repeats > 1) {
          if (interval.time) {
            const minutes = Math.floor(interval.time / 60);
            if (minutes > 0) {
              intervalParts.push(`, ${minutes}min break`);
            } else {
              intervalParts.push(`, ${interval.time}sec break`);
            }
          } else if (interval.distance) {
            const unit = workoutType === 'Swim' ? 'm' : 'km';
            intervalParts.push(`, ${interval.distance}${unit} break`);
          }
          return; // Skip adding this interval separately
        }
      }

      // Add repeats prefix if > 1
      if (interval.repeats && interval.repeats > 1) {
        parts.push(`${interval.repeats}*`);
      }

      // Add distance
      if (interval.distance) {
        const unit = workoutType === 'Swim' ? 'm' : 'km';
        parts.push(`${interval.distance}${unit}`);
      }

      // Add note
      if (interval.note) {
        parts.push(interval.note);
      }

      if (parts.length > 0) {
        intervalParts.push(parts.join(' '));
      }
    });

    if (intervalParts.length > 0) {
      workoutText += ` • ${intervalParts.join(' ')}`;
    } else {
      workoutText += ` • ${workout.intervals.length} interval${workout.intervals.length > 1 ? 's' : ''}`;
    }
  }
  if (workout.exercises && workout.exercises.length > 0) {
    workoutText += ` • ${workout.exercises.length} exercise${workout.exercises.length > 1 ? 's' : ''}`;
  }

  return workoutText;
}

export function getRecentWorkouts(workouts: Workout[], days: number = 7): Workout[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return workouts.filter((w) => new Date(w.date) >= cutoff);
}

// Get workouts by userId (Clerk user ID)
export function getWorkoutsByUserId(workouts: Workout[], userId: string): Workout[] {
  return workouts.filter((w) => w.userId === userId);
}

// Deprecated: Use getWorkoutsByUserId instead
export function getWorkoutsByMemberId(workouts: Workout[], memberId: string): Workout[] {
  return getWorkoutsByUserId(workouts, memberId);
}

export function getWeeklyPlanProgress(
  group: Group | null,
  memberId: string,
  workouts: Workout[],
  weekKey?: string
): {
  completed: number;
  total: number;
  percentage: number;
  breakdown?: Record<string, { planned: number; logged: number; unit: string }>;
} {
  if (!group?.trainingPlan) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const weekPlanData = getWeekPlan(group, weekKey);
  const weekPlan: Record<string, (string | PlannedWorkout)[]> = {};
  DAYS.forEach((day) => {
    weekPlan[day] = weekPlanData[day] || [];
  });

  // Get all workouts for the week (not just recent)
  const currentWeekKey = weekKey || getWeekKey();
  const { start: monday, end: sunday } = getWeekRange(currentWeekKey);

  // Use local date strings for comparison to avoid timezone issues
  const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  const weekEnd = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

  const weekWorkouts = workouts.filter((w) => {
    const workoutDate = new Date(w.date);
    const workoutDateStr = `${workoutDate.getFullYear()}-${String(workoutDate.getMonth() + 1).padStart(2, '0')}-${String(workoutDate.getDate()).padStart(2, '0')}`;
    return workoutDateStr >= weekStart && workoutDateStr <= weekEnd;
  });

  const memberWorkouts = getWorkoutsByMemberId(weekWorkouts, memberId);

  // Check if any planned workout has an amount
  const hasAmountsInPlan = Object.values(weekPlan).some((dayWorkouts) =>
    dayWorkouts.some((w) => typeof w === 'object' && w.type !== 'Rest' && w.amount !== undefined)
  );

  // Calculate totals by type and unit
  const plannedByType: Record<string, { amount: number; unit: string }> = {};
  const loggedByType: Record<string, { amount: number; unit: string }> = {};

  if (hasAmountsInPlan) {
    // Sum up planned amounts by type and unit (only count workouts with amounts)
    Object.values(weekPlan).forEach((dayWorkouts) => {
      dayWorkouts.forEach((w) => {
        if (typeof w === 'object' && w.type !== 'Rest' && w.amount !== undefined) {
          const key = `${w.type}_${w.unit || 'km'}`;
          if (!plannedByType[key]) {
            plannedByType[key] = { amount: 0, unit: w.unit || 'km' };
          }
          plannedByType[key].amount += w.amount;
        }
      });
    });

    // Sum up logged amounts by type and unit
    memberWorkouts.forEach((w) => {
      const loggedAmount = w.amount || w.distance; // Support legacy distance
      const loggedUnit = w.unit || (w.type === 'Swim' ? 'm' : 'km');

      if (loggedAmount !== undefined) {
        const key = `${w.type}_${loggedUnit}`;
        if (!loggedByType[key]) {
          loggedByType[key] = { amount: 0, unit: loggedUnit };
        }
        loggedByType[key].amount += loggedAmount;
      }
    });

    // Calculate totals and percentage - only count logged amounts that match planned types
    let totalPlanned = 0;
    let totalLoggedMatched = 0; // Only count amounts that match planned types
    const breakdown: Record<string, { planned: number; logged: number; unit: string }> = {};

    // First, sum all planned amounts and initialize breakdown
    Object.entries(plannedByType).forEach(([key, data]) => {
      totalPlanned += data.amount;
      const type = key.split('_')[0];
      if (!breakdown[type]) {
        breakdown[type] = { planned: 0, logged: 0, unit: data.unit };
      }
      breakdown[type].planned += data.amount;
    });

    // Now, only count logged amounts that match planned types (and cap at planned amount)
    Object.entries(plannedByType).forEach(([key, plannedData]) => {
      const type = key.split('_')[0];
      const unit = plannedData.unit;

      // Find logged amounts for this type and unit
      const loggedKey = `${type}_${unit}`;
      const loggedData = loggedByType[loggedKey];

      if (loggedData) {
        // Only count up to the planned amount (cap at 100% per type)
        const matchedAmount = Math.min(loggedData.amount, plannedData.amount);
        totalLoggedMatched += matchedAmount;
        breakdown[type].logged = matchedAmount;
      }
    });

    if (totalPlanned === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const percentage = Math.round((totalLoggedMatched / totalPlanned) * 100);

    return {
      completed: Math.round(totalLoggedMatched),
      total: Math.round(totalPlanned),
      percentage,
      breakdown,
    };
  } else {
    // No amounts in plan, count workouts instead
    const plannedCount = Object.values(weekPlan)
      .flat()
      .filter((w) => typeof w === 'string' || (typeof w === 'object' && w.type !== 'Rest')).length;
    const loggedCount = memberWorkouts.length;

    if (plannedCount === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const percentage = Math.round((loggedCount / plannedCount) * 100);
    return {
      completed: loggedCount,
      total: plannedCount,
      percentage,
    };
  }
}

// Re-export formatDateForDisplay as formatDate for backward compatibility
export function formatDate(dateString: string): string {
  return formatDateForDisplay(dateString);
}

export function getInviteUrl(group: Group | null): string {
  if (!group) return '';
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${group.inviteCode}`;
}

// Re-export from date-utils for backward compatibility
export { getDayIndex, isTodayDay as isToday } from './date-utils';

export interface GroupStatistics {
  totalCalories: number;
  totalKilometers: number;
  totalWorkouts: number;
  totalDuration: number; // in minutes
  activeDays: number;
  averagePace: number | null; // min/km for Run workouts
  currentStreak: number; // consecutive days with workouts
  averageCaloriesPerWorkout: number | null; // average calories per workout
}

/**
 * Calculate aggregated group statistics from workouts
 */
export function getGroupStatistics(workouts: Workout[]): GroupStatistics {
  if (workouts.length === 0) {
    return {
      totalCalories: 0,
      totalKilometers: 0,
      totalWorkouts: 0,
      totalDuration: 0,
      activeDays: 0,
      averagePace: null,
      currentStreak: 0,
      averageCaloriesPerWorkout: null,
    };
  }

  let totalCalories = 0;
  let totalKilometers = 0;
  let totalDuration = 0;
  let workoutsWithCalories = 0;
  const uniqueDates = new Set<string>();
  const runPaces: number[] = [];

  workouts.forEach((workout) => {
    // Sum calories
    if (workout.calories) {
      totalCalories += workout.calories;
      workoutsWithCalories++;
    }

    // Sum distance (handle both amount/unit and legacy distance field)
    const distance = workout.amount || workout.distance;
    const unit = workout.unit || 'km';

    if (distance !== undefined) {
      // Convert to kilometers
      if (unit === 'km') {
        totalKilometers += distance;
      } else if (unit === 'm') {
        totalKilometers += distance / 1000;
      } else if (unit === 'mi') {
        totalKilometers += distance * 1.60934;
      } else {
        // Default to km if unit is unknown
        totalKilometers += distance;
      }
    }

    // Sum duration
    if (workout.duration) {
      totalDuration += workout.duration;
    }

    // Track unique dates
    uniqueDates.add(workout.date);

    // Collect run paces for average
    if (workout.type === 'Run' && workout.avgPace) {
      runPaces.push(workout.avgPace);
    }
  });

  // Calculate average pace
  const averagePace =
    runPaces.length > 0
      ? runPaces.reduce((sum, pace) => sum + pace, 0) / runPaces.length
      : null;

  // Calculate average calories per workout
  const averageCaloriesPerWorkout =
    workoutsWithCalories > 0 ? totalCalories / workoutsWithCalories : null;

  // Calculate current streak (consecutive days with workouts)
  const sortedDates = Array.from(uniqueDates)
    .map((date) => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

  let currentStreak = 0;
  if (sortedDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today or yesterday has a workout
    const mostRecentDate = sortedDates[0];
    mostRecentDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 1) {
      // Start counting from most recent date
      let expectedDate = new Date(mostRecentDate);
      for (const workoutDate of sortedDates) {
        const workoutDateOnly = new Date(workoutDate);
        workoutDateOnly.setHours(0, 0, 0, 0);

        if (
          workoutDateOnly.getTime() === expectedDate.getTime() ||
          workoutDateOnly.getTime() === expectedDate.getTime() - 86400000
        ) {
          currentStreak++;
          expectedDate = new Date(workoutDateOnly);
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  return {
    totalCalories: Math.round(totalCalories),
    totalKilometers: Math.round(totalKilometers * 10) / 10, // Round to 1 decimal
    totalWorkouts: workouts.length,
    totalDuration: Math.round(totalDuration),
    activeDays: uniqueDates.size,
    averagePace: averagePace ? Math.round(averagePace * 10) / 10 : null,
    currentStreak,
    averageCaloriesPerWorkout: averageCaloriesPerWorkout
      ? Math.round(averageCaloriesPerWorkout)
      : null,
  };
}
