import type { Group, Workout } from './db';

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export function getDaysUntilGoal(goalDate: string): number {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const goal = new Date(goalDate);
	goal.setHours(0, 0, 0, 0);
	const diff = goal.getTime() - today.getTime();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getCurrentWeekPlan(group: Group | null): Record<string, string[]> {
	if (!group?.trainingPlan) return {};

	const plan: Record<string, string[]> = {};
	DAYS.forEach((day) => {
		plan[day] = group.trainingPlan[day] || [];
	});
	return plan;
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
): { completed: number; total: number; percentage: number } {
	if (!group?.trainingPlan) {
		return { completed: 0, total: 0, percentage: 0 };
	}

	const weekPlan = getCurrentWeekPlan(group);
	const recentWorkouts = getRecentWorkouts(workouts);
	const memberWorkouts = getWorkoutsByMemberId(recentWorkouts, memberId);

	// Count total planned workouts for the week
	let totalPlanned = 0;
	Object.values(weekPlan).forEach((dayWorkouts) => {
		totalPlanned += dayWorkouts.length;
	});

	if (totalPlanned === 0) {
		return { completed: 0, total: 0, percentage: 0 };
	}

	// Count completed workouts (matching planned workouts)
	const today = new Date();
	const dayOfWeek = today.getDay();
	const monday = new Date(today);
	monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

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
			if (hasWorkout) {
				completed += weekPlan[day].length;
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
