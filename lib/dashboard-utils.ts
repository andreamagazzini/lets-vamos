import type { Group, Workout, PlannedWorkout, WeeklyPlan } from './db';

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export function getDaysUntilGoal(goalDate: string): number {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const goal = new Date(goalDate);
	goal.setHours(0, 0, 0, 0);
	const diff = goal.getTime() - today.getTime();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get the Monday date (start of week) for a given date
 * Returns date string in format "YYYY-MM-DD"
 */
export function getWeekKey(date: Date = new Date()): string {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
	const monday = new Date(d);
	monday.setDate(diff);
	monday.setHours(0, 0, 0, 0);
	return monday.toISOString().split('T')[0];
}

/**
 * Get the plan for a specific week
 * Checks weeklyPlanOverrides first, then falls back to default trainingPlan
 */
export function getWeekPlan(
	group: Group | null,
	weekKey?: string,
): WeeklyPlan {
	if (!group?.trainingPlan) return {};

	const key = weekKey || getWeekKey();

	// Check if there's an override for this week
	if (group.weeklyPlanOverrides?.[key]) {
		return group.weeklyPlanOverrides[key];
	}

	// Return default plan
	return group.trainingPlan;
}

/**
 * Get start (Monday) and end (Sunday) dates for a week key
 */
export function getWeekRange(weekKey: string): { start: Date; end: Date } {
	const start = new Date(weekKey);
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return { start, end };
}

/**
 * Get previous or next week key
 */
export function getAdjacentWeekKey(
	weekKey: string,
	direction: 'prev' | 'next',
): string {
	const date = new Date(weekKey);
	const days = direction === 'prev' ? -7 : 7;
	date.setDate(date.getDate() + days);
	return getWeekKey(date);
}

export function getCurrentWeekPlan(
	group: Group | null,
): Record<string, (string | PlannedWorkout)[]> {
	const weekPlan = getWeekPlan(group);
	const plan: Record<string, (string | PlannedWorkout)[]> = {};
	DAYS.forEach((day) => {
		plan[day] = weekPlan[day] || [];
	});
	return plan;
}

export function isPlannedWorkout(
	workout: string | PlannedWorkout,
): workout is PlannedWorkout {
	return typeof workout === 'object' && workout !== null && 'type' in workout;
}

export function formatPlannedWorkout(
	workout: string | PlannedWorkout,
	settings?: { showDetails?: boolean },
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
		if (workout.distance) {
			parts.push(`${workout.distance} km`);
		}
	}
	return parts.join(' - ');
}

export function getRecentWorkouts(workouts: Workout[], days: number = 7): Workout[] {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);
	return workouts.filter((w) => new Date(w.date) >= cutoff);
}

export function getWorkoutsByMemberId(
	workouts: Workout[],
	memberId: string,
): Workout[] {
	return workouts.filter((w) => w.memberId === memberId);
}

export function getWeeklyPlanProgress(
	group: Group | null,
	memberId: string,
	workouts: Workout[],
	weekKey?: string,
): { completed: number; total: number; percentage: number } {
	if (!group?.trainingPlan) {
		return { completed: 0, total: 0, percentage: 0 };
	}

	const weekPlanData = getWeekPlan(group, weekKey);
	const weekPlan: Record<string, (string | PlannedWorkout)[]> = {};
	DAYS.forEach((day) => {
		weekPlan[day] = weekPlanData[day] || [];
	});
	const recentWorkouts = getRecentWorkouts(workouts);
	const memberWorkouts = getWorkoutsByMemberId(recentWorkouts, memberId);

	// Count total planned workouts for the week
	let totalPlanned = 0;
	Object.values(weekPlan).forEach((dayWorkouts) => {
		// Filter out "Rest" days from count
		const nonRestWorkouts = dayWorkouts.filter((w) => {
			if (typeof w === 'string') return true;
			return w.type !== 'Rest';
		});
		totalPlanned += nonRestWorkouts.length;
	});

	if (totalPlanned === 0) {
		return { completed: 0, total: 0, percentage: 0 };
	}

	// Count completed workouts (matching planned workouts)
	const currentWeekKey = weekKey || getWeekKey();
	const { start: monday } = getWeekRange(currentWeekKey);

	let completed = 0;
	DAYS.forEach((day, index) => {
		const date = new Date(monday);
		date.setDate(monday.getDate() + index);
		const dateKey = date.toISOString().split('T')[0];

		// Check if member has logged a workout on this day
		const hasWorkout = memberWorkouts.some((w) => {
			const workoutDate = new Date(w.date).toISOString().split('T')[0];
			return workoutDate === dateKey;
		});

		// If there's a planned workout for this day, check if it's completed
		if (weekPlan[day] && weekPlan[day].length > 0) {
			const dayWorkouts = weekPlan[day];
			// Filter out "Rest" days and count matches
			const nonRestWorkouts = dayWorkouts.filter((w) => {
				if (typeof w === 'string') return true;
				return w.type !== 'Rest';
			});

			if (hasWorkout && nonRestWorkouts.length > 0) {
				// Try to match workout type if structured
				const matchingWorkouts = nonRestWorkouts.filter((planned) => {
					if (typeof planned === 'string') {
						// For string plans, any workout on that day counts
						return true;
					}
					// For structured plans, try to match type
					return memberWorkouts.some((logged) => {
						const loggedDate = new Date(logged.date)
							.toISOString()
							.split('T')[0];
						return loggedDate === dateKey && logged.type === planned.type;
					});
				});
				completed += matchingWorkouts.length;
			}
		}
	});

	const percentage =
		totalPlanned > 0 ? Math.round((completed / totalPlanned) * 100) : 0;

	return { completed, total: totalPlanned, percentage };
}

export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	if (date.toDateString() === today.toDateString()) {
		return 'Today';
	} else if (date.toDateString() === yesterday.toDateString()) {
		return 'Yesterday';
	} else {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});
	}
}

export function getInviteUrl(group: Group | null): string {
	if (!group) return '';
	return `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${group.inviteCode}`;
}

export function getDayIndex(dayOfWeek: number): number {
	return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

export function isToday(dayIndex: number): boolean {
	const today = new Date();
	const dayOfWeek = today.getDay();
	return dayIndex === getDayIndex(dayOfWeek);
}
