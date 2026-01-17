"use client";

import { useState, useEffect } from "react";
import type { Workout, Member } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Clock } from "lucide-react";
import CardioFields from "./workout-form/CardioFields";
import IntervalsSection from "./workout-form/IntervalsSection";
import StrengthTrainingSection from "./workout-form/StrengthTrainingSection";
import {
	validateWorkout,
	buildWorkoutData,
	initializeFormState,
	type WorkoutFormState,
} from "./workout-form/workoutFormUtils";
import type { Interval, Exercise } from "@/lib/db";

const WORKOUT_TYPES = ["Run", "Bike", "Swim", "Strength", "Other"];

interface LogWorkoutModalProps {
	groupId: string;
	members: Member[];
	workout?: Workout | null;
	onSave: (workout: Omit<Workout, "id" | "createdAt">) => void;
	onClose: () => void;
}

export default function LogWorkoutModal({
	groupId,
	members,
	workout,
	onSave,
	onClose,
}: LogWorkoutModalProps) {
	const user = getCurrentUser();
	const currentMember = members.find((m) => m.email === user?.email);

	const [state, setState] = useState<WorkoutFormState>(() =>
		initializeFormState(workout),
	);
	const [intervalsExpanded, setIntervalsExpanded] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		setState(initializeFormState(workout));
	}, [workout]);

	// Clear irrelevant fields when workout type changes
	useEffect(() => {
		if (!workout) {
			if (state.type === "Strength") {
				setState((prev) => ({
					...prev,
					distance: "",
					calories: "",
					avgHeartRate: "",
					intervals: [],
					avgSpeed: "",
					distancePer100m: "",
					laps: "",
					poolLength: "",
				}));
			} else if (state.type === "Run" || state.type === "Bike" || state.type === "Swim") {
				setState((prev) => ({ ...prev, exercises: [] }));
			} else {
				setState((prev) => ({
					...prev,
					distance: "",
					calories: "",
					avgHeartRate: "",
					intervals: [],
					exercises: [],
					avgSpeed: "",
					distancePer100m: "",
					laps: "",
					poolLength: "",
				}));
			}
		}
	}, [state.type, workout]);

	const updateState = (updates: Partial<WorkoutFormState>) => {
		setState((prev) => ({ ...prev, ...updates }));
	};

	// Interval handlers
	const addInterval = () => {
		setState((prev) => ({
			...prev,
			intervals: [...prev.intervals, { type: "warmup" }],
		}));
		setIntervalsExpanded(true);
	};

	const removeInterval = (index: number) => {
		setState((prev) => ({
			...prev,
			intervals: prev.intervals.filter((_, i) => i !== index),
		}));
	};

	const updateInterval = (
		index: number,
		field: keyof Interval,
		value: string | number,
	) => {
		setState((prev) => {
			const updated = [...prev.intervals];
			updated[index] = {
				...updated[index],
				[field]: value === "" ? undefined : value,
			};
			return { ...prev, intervals: updated };
		});
	};

	// Exercise handlers
	const addExercise = () => {
		setState((prev) => ({
			...prev,
			exercises: [...prev.exercises, { name: "", sets: [] }],
		}));
	};

	const removeExercise = (index: number) => {
		setState((prev) => ({
			...prev,
			exercises: prev.exercises.filter((_, i) => i !== index),
		}));
	};

	const updateExerciseName = (index: number, name: string) => {
		setState((prev) => {
			const updated = [...prev.exercises];
			updated[index] = { ...updated[index], name };
			return { ...prev, exercises: updated };
		});
	};

	const addSet = (exerciseIndex: number) => {
		setState((prev) => {
			const updated = [...prev.exercises];
			updated[exerciseIndex].sets = [...updated[exerciseIndex].sets, {}];
			return { ...prev, exercises: updated };
		});
	};

	const removeSet = (exerciseIndex: number, setIndex: number) => {
		setState((prev) => {
			const updated = [...prev.exercises];
			updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter(
				(_, i) => i !== setIndex,
			);
			return { ...prev, exercises: updated };
		});
	};

	const updateSet = (
		exerciseIndex: number,
		setIndex: number,
		field: "reps" | "weight",
		value: string,
	) => {
		setState((prev) => {
			const updated = [...prev.exercises];
			updated[exerciseIndex].sets[setIndex] = {
				...updated[exerciseIndex].sets[setIndex],
				[field]:
					value === ""
						? undefined
						: field === "reps"
							? parseInt(value)
							: parseFloat(value),
			};
			return { ...prev, exercises: updated };
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const newErrors = validateWorkout(state);

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		if (!currentMember) {
			alert("You must be a member of this group to log workouts");
			return;
		}

		const workoutData = buildWorkoutData(state, groupId, currentMember.id);
		onSave(workoutData);
	};

	const isCardio = state.type === "Run" || state.type === "Bike" || state.type === "Swim";

	return (
		<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
				<div className="flex items-center justify-between mb-8">
					<h2 className="heading-md text-black tracking-tight">Log Workout</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-black text-3xl font-light transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Workout Type */}
					<div>
						<label
							htmlFor="type"
							className="block text-sm font-semibold text-black mb-3"
						>
							Workout Type
						</label>
						<select
							id="type"
							value={state.type}
							onChange={(e) => updateState({ type: e.target.value })}
							className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
						>
							{WORKOUT_TYPES.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
						{errors.type && (
							<p className="mt-2 text-sm text-red-600 font-medium">{errors.type}</p>
						)}
					</div>

					{/* Cardio Fields */}
					{isCardio && (
						<>
							<CardioFields
								type={state.type as "Run" | "Bike" | "Swim"}
								duration={state.duration}
								distance={state.distance}
								calories={state.calories}
								avgHeartRate={state.avgHeartRate}
								avgSpeed={state.avgSpeed}
								distancePer100m={state.distancePer100m}
								laps={state.laps}
								poolLength={state.poolLength}
								errors={errors}
								onDurationChange={(value) => updateState({ duration: value })}
								onDistanceChange={(value) => updateState({ distance: value })}
								onCaloriesChange={(value) => updateState({ calories: value })}
								onAvgHeartRateChange={(value) =>
									updateState({ avgHeartRate: value })
								}
								onAvgSpeedChange={(value) => updateState({ avgSpeed: value })}
								onDistancePer100mChange={(value) =>
									updateState({ distancePer100m: value })
								}
								onLapsChange={(value) => updateState({ laps: value })}
								onPoolLengthChange={(value) => updateState({ poolLength: value })}
							/>

							<IntervalsSection
								type={state.type as "Run" | "Bike" | "Swim"}
								intervals={state.intervals}
								expanded={intervalsExpanded}
								onToggle={() => setIntervalsExpanded(!intervalsExpanded)}
								onAdd={addInterval}
								onRemove={removeInterval}
								onUpdate={updateInterval}
							/>
						</>
					)}

					{/* Strength Training */}
					{state.type === "Strength" && (
						<StrengthTrainingSection
							exercises={state.exercises}
							errors={errors}
							onAddExercise={addExercise}
							onRemoveExercise={removeExercise}
							onUpdateExerciseName={updateExerciseName}
							onAddSet={addSet}
							onRemoveSet={removeSet}
							onUpdateSet={updateSet}
						/>
					)}

					{/* Other workout types */}
					{state.type === "Other" && (
						<div>
							<label
								htmlFor="duration"
								className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
							>
								<Clock className="w-4 h-4" />
								Duration (minutes)
							</label>
							<input
								id="duration"
								type="number"
								value={state.duration}
								onChange={(e) => updateState({ duration: e.target.value })}
								className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
								placeholder="30"
							/>
							{errors.duration && (
								<p className="mt-2 text-sm text-red-600 font-medium">
									{errors.duration}
								</p>
							)}
						</div>
					)}

					{/* Notes */}
					<div>
						<label
							htmlFor="notes"
							className="block text-sm font-semibold text-black mb-3"
						>
							Notes - Optional
						</label>
						<textarea
							id="notes"
							value={state.notes}
							onChange={(e) => updateState({ notes: e.target.value })}
							rows={3}
							className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-primary transition-colors resize-none"
							placeholder="Felt great, good pace"
						/>
					</div>

					{/* Date */}
					<div>
						<label
							htmlFor="date"
							className="block text-sm font-semibold text-black mb-3"
						>
							Date
						</label>
						<input
							id="date"
							type="date"
							value={state.date}
							onChange={(e) => updateState({ date: e.target.value })}
							className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
						/>
						{errors.date && (
							<p className="mt-2 text-sm text-red-600 font-medium">{errors.date}</p>
						)}
					</div>

					<button type="submit" className="btn-primary w-full text-lg">
						{workout ? "Update Workout" : "Log Workout"}
					</button>
				</form>
			</div>
		</div>
	);
}
