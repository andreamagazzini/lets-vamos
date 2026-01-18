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
    if ((workout as any).distance) {
      parts.push(`${(workout as any).distance} km`);
    }
  }
  return parts.join(' - ');
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
