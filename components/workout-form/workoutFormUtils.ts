import type { Workout, Interval, Exercise } from "@/lib/db";

export interface WorkoutFormState {
	type: string;
	duration: string;
	distance: string;
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
}

export function validateWorkout(
	state: WorkoutFormState,
): Record<string, string> {
	const errors: Record<string, string> = {};

	if (!state.type) {
		errors.type = "Workout type is required";
	}

	if (state.type === "Strength") {
		if (state.exercises.length === 0) {
			errors.exercises = "At least one exercise is required";
		} else {
			state.exercises.forEach((exercise, idx) => {
				if (!exercise.name.trim()) {
					errors[`exercise-${idx}-name`] = "Exercise name is required";
				}
				if (exercise.sets.length === 0) {
					errors[`exercise-${idx}-sets`] = "At least one set is required";
				}
			});
		}
	} else if (state.type === "Run" || state.type === "Bike" || state.type === "Swim") {
		if (!state.duration && !state.distance) {
			errors.duration = "At least one of duration or distance is required";
			errors.distance = "At least one of duration or distance is required";
		}
	} else {
		if (!state.duration && !state.notes.trim()) {
			errors.duration = "At least one of duration or notes is required";
		}
	}

	if (!state.date) {
		errors.date = "Date is required";
	} else {
		const selectedDate = new Date(state.date);
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		if (selectedDate > today) {
			errors.date = "Date cannot be in the future";
		}
	}

	return errors;
}

export function buildWorkoutData(
	state: WorkoutFormState,
	groupId: string,
	memberId: string,
): Omit<Workout, "id" | "createdAt"> {
	return {
		groupId,
		memberId,
		type: state.type,
		duration: state.duration ? parseInt(state.duration) : undefined,
		distance: state.distance ? parseFloat(state.distance) : undefined,
		calories: state.calories ? parseInt(state.calories) : undefined,
		avgHeartRate: state.avgHeartRate ? parseInt(state.avgHeartRate) : undefined,
		notes: state.notes.trim() || undefined,
		date: state.date,
		intervals: state.intervals.length > 0 ? state.intervals : undefined,
		avgSpeed:
			state.type === "Bike" && state.avgSpeed ? parseFloat(state.avgSpeed) : undefined,
		distancePer100m:
			state.type === "Swim" && state.distancePer100m
				? parseFloat(state.distancePer100m)
				: undefined,
		laps: state.type === "Swim" && state.laps ? parseInt(state.laps) : undefined,
		poolLength:
			state.type === "Swim" && state.poolLength
				? parseInt(state.poolLength)
				: undefined,
		exercises:
			state.type === "Strength" && state.exercises.length > 0
				? state.exercises
				: undefined,
	};
}

export function initializeFormState(workout?: Workout | null): WorkoutFormState {
	if (workout) {
		return {
			type: workout.type,
			duration: workout.duration?.toString() || "",
			distance: workout.distance?.toString() || "",
			calories: workout.calories?.toString() || "",
			avgHeartRate: workout.avgHeartRate?.toString() || "",
			notes: workout.notes || "",
			date: workout.date,
			intervals: workout.intervals || [],
			avgSpeed: workout.avgSpeed?.toString() || "",
			distancePer100m: workout.distancePer100m?.toString() || "",
			laps: workout.laps?.toString() || "",
			poolLength: workout.poolLength?.toString() || "",
			exercises: workout.exercises || [],
		};
	}

	const today = new Date().toISOString().split("T")[0];
	return {
		type: "Run",
		duration: "",
		distance: "",
		calories: "",
		avgHeartRate: "",
		notes: "",
		date: today,
		intervals: [],
		avgSpeed: "",
		distancePer100m: "",
		laps: "",
		poolLength: "",
		exercises: [],
	};
}
