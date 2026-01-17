"use client";

import { useState, useEffect } from "react";
import type { Workout, Member, Interval, Exercise } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
	Clock,
	MapPin,
	Flame,
	Heart,
	Waves,
	Dumbbell,
	Plus,
	Trash2,
	ChevronDown,
	ChevronUp,
	Gauge,
} from "lucide-react";

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

	// Common fields
	const [type, setType] = useState("Run");
	const [duration, setDuration] = useState("");
	const [distance, setDistance] = useState("");
	const [calories, setCalories] = useState("");
	const [avgHeartRate, setAvgHeartRate] = useState("");
	const [notes, setNotes] = useState("");
	const [date, setDate] = useState("");

	// Cardio intervals
	const [intervals, setIntervals] = useState<Interval[]>([]);
	const [intervalsExpanded, setIntervalsExpanded] = useState(false);

	// Bike-specific
	const [avgSpeed, setAvgSpeed] = useState("");

	// Swim-specific
	const [distancePer100m, setDistancePer100m] = useState("");
	const [laps, setLaps] = useState("");
	const [poolLength, setPoolLength] = useState("");

	// Strength training
	const [exercises, setExercises] = useState<Exercise[]>([]);

	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (workout) {
			setType(workout.type);
			setDuration(workout.duration?.toString() || "");
			setDistance(workout.distance?.toString() || "");
			setCalories(workout.calories?.toString() || "");
			setAvgHeartRate(workout.avgHeartRate?.toString() || "");
			setNotes(workout.notes || "");
			setDate(workout.date);
			setIntervals(workout.intervals || []);
			setAvgSpeed(workout.avgSpeed?.toString() || "");
			setDistancePer100m(workout.distancePer100m?.toString() || "");
			setLaps(workout.laps?.toString() || "");
			setPoolLength(workout.poolLength?.toString() || "");
			setExercises(workout.exercises || []);
		} else {
			const today = new Date().toISOString().split("T")[0];
			setDate(today);
			setIntervals([]);
			setExercises([]);
		}
	}, [workout]);

	// Clear irrelevant fields when workout type changes
	useEffect(() => {
		if (!workout) {
			if (type === "Strength") {
				setDistance("");
				setCalories("");
				setAvgHeartRate("");
				setIntervals([]);
				setAvgSpeed("");
				setDistancePer100m("");
				setLaps("");
				setPoolLength("");
			} else if (type === "Run" || type === "Bike" || type === "Swim") {
				setExercises([]);
			} else {
				setDistance("");
				setCalories("");
				setAvgHeartRate("");
				setIntervals([]);
				setExercises([]);
				setAvgSpeed("");
				setDistancePer100m("");
				setLaps("");
				setPoolLength("");
			}
		}
	}, [type, workout]);

	const addInterval = () => {
		setIntervals([...intervals, { type: "warmup" }]);
		setIntervalsExpanded(true);
	};

	const removeInterval = (index: number) => {
		setIntervals(intervals.filter((_, i) => i !== index));
	};

	const updateInterval = (
		index: number,
		field: keyof Interval,
		value: string | number,
	) => {
		const updated = [...intervals];
		updated[index] = {
			...updated[index],
			[field]: value === "" ? undefined : value,
		};
		setIntervals(updated);
	};

	const addExercise = () => {
		setExercises([...exercises, { name: "", sets: [] }]);
	};

	const removeExercise = (index: number) => {
		setExercises(exercises.filter((_, i) => i !== index));
	};

	const updateExerciseName = (index: number, name: string) => {
		const updated = [...exercises];
		updated[index] = { ...updated[index], name };
		setExercises(updated);
	};

	const addSet = (exerciseIndex: number) => {
		const updated = [...exercises];
		updated[exerciseIndex].sets = [...updated[exerciseIndex].sets, {}];
		setExercises(updated);
	};

	const removeSet = (exerciseIndex: number, setIndex: number) => {
		const updated = [...exercises];
		updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter(
			(_, i) => i !== setIndex,
		);
		setExercises(updated);
	};

	const updateSet = (
		exerciseIndex: number,
		setIndex: number,
		field: "reps" | "weight",
		value: string,
	) => {
		const updated = [...exercises];
		updated[exerciseIndex].sets[setIndex] = {
			...updated[exerciseIndex].sets[setIndex],
			[field]:
				value === ""
					? undefined
					: field === "reps"
						? parseInt(value)
						: parseFloat(value),
		};
		setExercises(updated);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const newErrors: Record<string, string> = {};

		if (!type) {
			newErrors.type = "Workout type is required";
		}

		// Validation based on workout type
		if (type === "Strength") {
			if (exercises.length === 0) {
				newErrors.exercises = "At least one exercise is required";
			} else {
				exercises.forEach((exercise, idx) => {
					if (!exercise.name.trim()) {
						newErrors[`exercise-${idx}-name`] = "Exercise name is required";
					}
					if (exercise.sets.length === 0) {
						newErrors[`exercise-${idx}-sets`] = "At least one set is required";
					}
				});
			}
		} else if (type === "Run" || type === "Bike" || type === "Swim") {
			if (!duration && !distance) {
				newErrors.duration = "At least one of duration or distance is required";
				newErrors.distance = "At least one of duration or distance is required";
			}
		} else {
			// Other workout types - at least duration or notes
			if (!duration && !notes.trim()) {
				newErrors.duration = "At least one of duration or notes is required";
			}
		}

		if (!date) {
			newErrors.date = "Date is required";
		} else {
			const selectedDate = new Date(date);
			const today = new Date();
			today.setHours(23, 59, 59, 999);
			if (selectedDate > today) {
				newErrors.date = "Date cannot be in the future";
			}
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		if (!currentMember) {
			alert("You must be a member of this group to log workouts");
			return;
		}

		const workoutData: Omit<Workout, "id" | "createdAt"> = {
			groupId,
			memberId: currentMember.id,
			type,
			duration: duration ? parseInt(duration) : undefined,
			distance: distance ? parseFloat(distance) : undefined,
			calories: calories ? parseInt(calories) : undefined,
			avgHeartRate: avgHeartRate ? parseInt(avgHeartRate) : undefined,
			notes: notes.trim() || undefined,
			date,
			intervals: intervals.length > 0 ? intervals : undefined,
			avgSpeed: type === "Bike" && avgSpeed ? parseFloat(avgSpeed) : undefined,
			distancePer100m:
				type === "Swim" && distancePer100m
					? parseFloat(distancePer100m)
					: undefined,
			laps: type === "Swim" && laps ? parseInt(laps) : undefined,
			poolLength:
				type === "Swim" && poolLength ? parseInt(poolLength) : undefined,
			exercises:
				type === "Strength" && exercises.length > 0 ? exercises : undefined,
		};

		onSave(workoutData);
	};

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
							value={type}
							onChange={(e) => setType(e.target.value)}
							className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
						>
							{WORKOUT_TYPES.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
						{errors.type && (
							<p className="mt-2 text-sm text-red-600 font-medium">
								{errors.type}
							</p>
						)}
					</div>

					{/* Run/Bike/Swim Cardio Fields */}
					{(type === "Run" || type === "Bike" || type === "Swim") && (
						<>
							{/* Main Metrics Grid */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="duration"
										className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
									>
										<Clock className="w-4 h-4" />
										Duration (min)
									</label>
									<input
										id="duration"
										type="number"
										value={duration}
										onChange={(e) => setDuration(e.target.value)}
										className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
										placeholder="45"
									/>
									{errors.duration && (
										<p className="mt-2 text-sm text-red-600 font-medium">
											{errors.duration}
										</p>
									)}
								</div>

								<div>
									<label
										htmlFor="distance"
										className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
									>
										<MapPin className="w-4 h-4" />
										Distance ({type === "Swim" ? "m" : "km"})
									</label>
									<input
										id="distance"
										type="number"
										step={type === "Swim" ? "1" : "0.1"}
										value={distance}
										onChange={(e) => setDistance(e.target.value)}
										className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
										placeholder={type === "Swim" ? "1500" : "8.5"}
									/>
									{errors.distance && (
										<p className="mt-2 text-sm text-red-600 font-medium">
											{errors.distance}
										</p>
									)}
								</div>

								<div>
									<label
										htmlFor="calories"
										className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
									>
										<Flame className="w-4 h-4" />
										Calories
									</label>
									<input
										id="calories"
										type="number"
										value={calories}
										onChange={(e) => setCalories(e.target.value)}
										className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
										placeholder="650"
									/>
								</div>

								<div>
									<label
										htmlFor="avgHeartRate"
										className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
									>
										<Heart className="w-4 h-4" />
										Avg Heart Rate (bpm)
									</label>
									<input
										id="avgHeartRate"
										type="number"
										value={avgHeartRate}
										onChange={(e) => setAvgHeartRate(e.target.value)}
										className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
										placeholder="155"
									/>
								</div>
							</div>

							{/* Bike-specific: Avg Speed */}
							{type === "Bike" && (
								<div>
									<label
										htmlFor="avgSpeed"
										className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
									>
										<Gauge className="w-4 h-4" />
										Avg Speed (km/h)
									</label>
									<input
										id="avgSpeed"
										type="number"
										step="0.1"
										value={avgSpeed}
										onChange={(e) => setAvgSpeed(e.target.value)}
										className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
										placeholder="25.5"
									/>
								</div>
							)}

							{/* Swim-specific fields */}
							{type === "Swim" && (
								<div className="grid grid-cols-3 gap-4">
									<div>
										<label
											htmlFor="distancePer100m"
											className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
										>
											<Waves className="w-4 h-4" />
											Pace (sec/100m)
										</label>
										<input
											id="distancePer100m"
											type="number"
											step="0.1"
											value={distancePer100m}
											onChange={(e) => setDistancePer100m(e.target.value)}
											className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
											placeholder="90"
										/>
									</div>

									<div>
										<label
											htmlFor="laps"
											className="block text-sm font-semibold text-black mb-3"
										>
											Laps
										</label>
										<input
											id="laps"
											type="number"
											value={laps}
											onChange={(e) => setLaps(e.target.value)}
											className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
											placeholder="30"
										/>
									</div>

									<div>
										<label
											htmlFor="poolLength"
											className="block text-sm font-semibold text-black mb-3"
										>
											Pool Length (m)
										</label>
										<input
											id="poolLength"
											type="number"
											value={poolLength}
											onChange={(e) => setPoolLength(e.target.value)}
											className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
											placeholder="50"
										/>
									</div>
								</div>
							)}

							{/* Intervals Section */}
							<div className="border-t border-gray-200 pt-6">
								<button
									type="button"
									onClick={() => setIntervalsExpanded(!intervalsExpanded)}
									className="flex items-center justify-between w-full mb-4"
								>
									<h3 className="text-sm font-semibold text-black">
										Intervals (Optional)
									</h3>
									{intervalsExpanded ? (
										<ChevronUp className="w-5 h-5" />
									) : (
										<ChevronDown className="w-5 h-5" />
									)}
								</button>

								{intervalsExpanded && (
									<div className="space-y-4">
										{intervals.map((interval, index) => (
											<div
												key={`interval-${index}-${interval.type}`}
												className="p-4 bg-gray-50 rounded-xl border border-gray-200"
											>
												<div className="flex items-center justify-between mb-4">
													<select
														value={interval.type}
														onChange={(e) =>
															updateInterval(
																index,
																"type",
																e.target.value as
																	| "warmup"
																	| "work"
																	| "recovery",
															)
														}
														className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-primary"
													>
														<option value="warmup">Warmup</option>
														<option value="work">Work</option>
														<option value="recovery">Recovery</option>
													</select>
													<button
														type="button"
														onClick={() => removeInterval(index)}
														className="text-red-500 hover:text-red-700 p-1"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>

												<div className="grid grid-cols-2 gap-3">
													<div>
														<label
															htmlFor={`interval-${index}-distance`}
															className="block text-xs font-medium text-gray-600 mb-1"
														>
															Distance ({type === "Swim" ? "m" : "km"})
														</label>
														<input
															id={`interval-${index}-distance`}
															type="number"
															step={type === "Swim" ? "1" : "0.1"}
															value={interval.distance || ""}
															onChange={(e) =>
																updateInterval(
																	index,
																	"distance",
																	e.target.value === ""
																		? ""
																		: parseFloat(e.target.value),
																)
															}
															className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
															placeholder={type === "Swim" ? "100" : "0.4"}
														/>
													</div>

													<div>
														<label
															htmlFor={`interval-${index}-time`}
															className="block text-xs font-medium text-gray-600 mb-1"
														>
															Time (sec)
														</label>
														<input
															id={`interval-${index}-time`}
															type="number"
															value={interval.time || ""}
															onChange={(e) =>
																updateInterval(
																	index,
																	"time",
																	e.target.value === ""
																		? ""
																		: parseInt(e.target.value),
																)
															}
															className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
															placeholder="90"
														/>
													</div>

													<div>
														<label
															htmlFor={`interval-${index}-pace`}
															className="block text-xs font-medium text-gray-600 mb-1"
														>
															Pace (min/{type === "Swim" ? "100m" : "km"})
														</label>
														<input
															id={`interval-${index}-pace`}
															type="number"
															step="0.1"
															value={interval.pace || ""}
															onChange={(e) =>
																updateInterval(
																	index,
																	"pace",
																	e.target.value === ""
																		? ""
																		: parseFloat(e.target.value),
																)
															}
															className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
															placeholder="3.75"
														/>
													</div>

													<div>
														<label
															htmlFor={`interval-${index}-hr`}
															className="block text-xs font-medium text-gray-600 mb-1"
														>
															Heart Rate (bpm)
														</label>
														<input
															id={`interval-${index}-hr`}
															type="number"
															value={interval.avgHeartRate || ""}
															onChange={(e) =>
																updateInterval(
																	index,
																	"avgHeartRate",
																	e.target.value === ""
																		? ""
																		: parseInt(e.target.value),
																)
															}
															className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
															placeholder="175"
														/>
													</div>
												</div>
											</div>
										))}

										<button
											type="button"
											onClick={addInterval}
											className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border-2 border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
										>
											<Plus className="w-4 h-4" />
											Add Interval
										</button>
									</div>
								)}
							</div>
						</>
					)}

					{/* Strength Training */}
					{type === "Strength" && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="flex items-center gap-2 text-sm font-semibold text-black">
									<Dumbbell className="w-4 h-4" />
									Exercises
								</h3>
								<button
									type="button"
									onClick={addExercise}
									className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border-2 border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
								>
									<Plus className="w-4 h-4" />
									Add Exercise
								</button>
							</div>

							{exercises.map((exercise, exerciseIndex) => (
								<div
									key={`exercise-${exerciseIndex}`}
									className="p-4 bg-gray-50 rounded-xl border border-gray-200"
								>
									<div className="flex items-center justify-between mb-4">
										<input
											type="text"
											value={exercise.name}
											onChange={(e) =>
												updateExerciseName(exerciseIndex, e.target.value)
											}
											placeholder="Exercise name (e.g., Squats)"
											className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-primary"
										/>
										<button
											type="button"
											onClick={() => removeExercise(exerciseIndex)}
											className="ml-2 text-red-500 hover:text-red-700 p-1"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>

									{errors[`exercise-${exerciseIndex}-name`] && (
										<p className="mb-2 text-xs text-red-600 font-medium">
											{errors[`exercise-${exerciseIndex}-name`]}
										</p>
									)}

									<div className="space-y-2 mb-3">
										{exercise.sets.map((set, setIndex) => (
											<div
												key={`set-${exerciseIndex}-${setIndex}`}
												className="flex items-center gap-2"
											>
												<span className="text-xs font-medium text-gray-600 w-8">
													Set {setIndex + 1}
												</span>
												<input
													type="number"
													value={set.reps || ""}
													onChange={(e) =>
														updateSet(
															exerciseIndex,
															setIndex,
															"reps",
															e.target.value,
														)
													}
													placeholder="Reps"
													className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
												/>
												<input
													type="number"
													step="0.5"
													value={set.weight || ""}
													onChange={(e) =>
														updateSet(
															exerciseIndex,
															setIndex,
															"weight",
															e.target.value,
														)
													}
													placeholder="Weight (kg)"
													className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
												/>
												<button
													type="button"
													onClick={() => removeSet(exerciseIndex, setIndex)}
													className="text-red-500 hover:text-red-700 p-1"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										))}
									</div>

									{errors[`exercise-${exerciseIndex}-sets`] && (
										<p className="mb-2 text-xs text-red-600 font-medium">
											{errors[`exercise-${exerciseIndex}-sets`]}
										</p>
									)}

									<button
										type="button"
										onClick={() => addSet(exerciseIndex)}
										className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
									>
										<Plus className="w-3 h-3" />
										Add Set
									</button>
								</div>
							))}

							{errors.exercises && (
								<p className="text-sm text-red-600 font-medium">
									{errors.exercises}
								</p>
							)}
						</div>
					)}

					{/* Other workout types */}
					{type === "Other" && (
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
								value={duration}
								onChange={(e) => setDuration(e.target.value)}
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
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
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
							value={date}
							onChange={(e) => setDate(e.target.value)}
							className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
						/>
						{errors.date && (
							<p className="mt-2 text-sm text-red-600 font-medium">
								{errors.date}
							</p>
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
