"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, RotateCcw } from "lucide-react";
import { getGroup, updateGroup } from "@/lib/db";
import type { Group, WeeklyPlan, PlannedWorkout } from "@/lib/db";
import {
	DAYS,
	getWeekKey,
	getWeekPlan,
	getWeekRange,
} from "@/lib/dashboard-utils";
import WeekNavigator from "@/components/dashboard/WeekNavigator";
import PlannedWorkoutEditor from "@/components/workout-form/PlannedWorkoutEditor";

export default function EditPlanPage() {
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const groupId = params.groupId as string;
	const weekParam = searchParams.get("week");

	const [group, setGroup] = useState<Group | null>(null);
	const [currentWeekKey, setCurrentWeekKey] = useState(
		weekParam || getWeekKey(),
	);
	const [useDefaultPlan, setUseDefaultPlan] = useState(true);
	const [trainingPlan, setTrainingPlan] = useState<WeeklyPlan>({});
	const [editingDay, setEditingDay] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const loadGroup = useCallback(async () => {
		try {
			const loadedGroup = await getGroup(groupId);
			if (!loadedGroup) {
				router.push("/");
				return;
			}
			setGroup(loadedGroup);
		} catch (error) {
			console.error("Error loading group:", error);
		} finally {
			setLoading(false);
		}
	}, [groupId, router]);

	useEffect(() => {
		loadGroup();
	}, [loadGroup]);

	useEffect(() => {
		if (group) {
			// Check if this week has an override
			const hasOverride = !!group.weeklyPlanOverrides?.[currentWeekKey];
			setUseDefaultPlan(!hasOverride);

			// Load the appropriate plan
			const plan = getWeekPlan(group, currentWeekKey);
			setTrainingPlan(plan);
		}
	}, [group, currentWeekKey]);

	const handleAddWorkout = (day: string) => {
		setEditingDay(day);
	};

	const handleSaveWorkout = (
		day: string,
		workout: string | PlannedWorkout,
	) => {
		const newPlan = { ...trainingPlan };
		if (!newPlan[day]) {
			newPlan[day] = [];
		}
		newPlan[day] = [...newPlan[day], workout];
		setTrainingPlan(newPlan);
		setEditingDay(null);
	};

	const handleUpdateWorkout = (
		day: string,
		index: number,
		workout: string | PlannedWorkout,
	) => {
		const newPlan = { ...trainingPlan };
		if (newPlan[day]) {
			newPlan[day] = [...newPlan[day]];
			newPlan[day][index] = workout;
			setTrainingPlan(newPlan);
		}
	};

	const handleDeleteWorkout = (day: string, index: number) => {
		const newPlan = { ...trainingPlan };
		if (newPlan[day]) {
			newPlan[day] = newPlan[day].filter((_, i) => i !== index);
			if (newPlan[day].length === 0) {
				delete newPlan[day];
			}
			setTrainingPlan(newPlan);
		}
	};

	const handleTogglePlanType = () => {
		if (!group) return;

		const newUseDefault = !useDefaultPlan;
		setUseDefaultPlan(newUseDefault);

		if (newUseDefault) {
			// Switch to default plan
			setTrainingPlan(group.trainingPlan);
		} else {
			// Switch to week-specific plan (create from default if no override exists)
			const override = group.weeklyPlanOverrides?.[currentWeekKey];
			setTrainingPlan(override || group.trainingPlan);
		}
	};

	const handleResetToDefault = () => {
		if (!group) return;

		// Remove override for this week
		const newOverrides = { ...group.weeklyPlanOverrides };
		delete newOverrides[currentWeekKey];

		const updatedGroup: Group = {
			...group,
			weeklyPlanOverrides:
				Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
		};

		updateGroup(updatedGroup).then(() => {
			setGroup(updatedGroup);
			setUseDefaultPlan(true);
			setTrainingPlan(group.trainingPlan);
		});
	};

	const handleSave = async () => {
		if (!group) return;

		setSaving(true);
		try {
			if (useDefaultPlan) {
				// Update default plan
				const updatedGroup: Group = {
					...group,
					trainingPlan,
				};
				await updateGroup(updatedGroup);
			} else {
				// Update week-specific override
				const newOverrides = {
					...(group.weeklyPlanOverrides || {}),
					[currentWeekKey]: trainingPlan,
				};
				const updatedGroup: Group = {
					...group,
					weeklyPlanOverrides: newOverrides,
				};
				await updateGroup(updatedGroup);
			}
			router.push(`/dashboard/${groupId}`);
		} catch (error) {
			console.error("Error saving plan:", error);
		} finally {
			setSaving(false);
		}
	};

	if (loading || !group) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-500">Loading...</div>
			</div>
		);
	}

	const { start } = getWeekRange(currentWeekKey);
	const isUsingOverride = !!group.weeklyPlanOverrides?.[currentWeekKey];

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
				{/* Header */}
				<div className="mb-6">
					<button
						type="button"
						onClick={() => router.push(`/dashboard/${groupId}`)}
						className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Dashboard
					</button>
					<h1 className="heading-lg text-gray-900 mb-4">
						Edit Training Plan
					</h1>

					<WeekNavigator
						currentWeekKey={currentWeekKey}
						onWeekChange={setCurrentWeekKey}
					/>

					{/* Plan Type Toggle */}
					<div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
							<div className="flex items-center justify-between mb-3">
								<div>
									<span className="text-sm font-semibold text-gray-700">
										{useDefaultPlan
											? "Editing Default Plan"
											: "Editing Week-Specific Plan"}
									</span>
								<p className="text-xs text-gray-500 mt-1">
									{useDefaultPlan
										? "Changes will apply to all weeks using the default plan"
										: `Custom plan for week of ${start.toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
											})}`}
								</p>
							</div>
							<button
								type="button"
								onClick={handleTogglePlanType}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									useDefaultPlan ? "bg-gray-300" : "bg-primary"
								}`}
								aria-label="Toggle plan type"
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										useDefaultPlan ? "translate-x-1" : "translate-x-6"
									}`}
								/>
							</button>
						</div>

						{!useDefaultPlan && isUsingOverride && (
							<button
								type="button"
								onClick={handleResetToDefault}
								className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
							>
								<RotateCcw className="w-4 h-4" />
								Reset to default plan
							</button>
						)}
					</div>
				</div>

				{/* Plan Editor */}
				<div className="space-y-6">
					{DAYS.map((day) => {
						const dayWorkouts = trainingPlan[day] || [];
						const isEditing = editingDay === day;

						return (
							<div key={day} className="border-b border-gray-200 pb-6 last:border-0">
								<div className="flex items-center justify-between mb-3">
									<h3 className="heading-sm text-gray-900">{day}</h3>
									{!isEditing && (
										<button
											type="button"
											onClick={() => handleAddWorkout(day)}
											className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
										>
											<Plus className="w-4 h-4" />
											Add Workout
										</button>
									)}
								</div>

								{isEditing && (
									<div className="mb-4">
										<PlannedWorkoutEditor
											workout=""
											onUpdate={(workout) => {
												handleSaveWorkout(day, workout);
												setEditingDay(null);
											}}
											onDelete={() => setEditingDay(null)}
										/>
									</div>
								)}

								{dayWorkouts.length > 0 ? (
									<div className="space-y-3">
										{dayWorkouts.map((workout, index) => {
											const workoutKey =
												typeof workout === "string"
													? `${day}-${index}-${workout}`
													: `${day}-${index}-${workout.type}-${workout.description || ""}`;
											return (
												<PlannedWorkoutEditor
													key={workoutKey}
													workout={workout}
													onUpdate={(updated) =>
														handleUpdateWorkout(day, index, updated)
													}
													onDelete={() => handleDeleteWorkout(day, index)}
												/>
											);
										})}
									</div>
								) : (
									!isEditing && (
										<div className="text-sm text-gray-400 italic">
											No workouts planned
										</div>
									)
								)}
							</div>
						);
					})}
				</div>

				{/* Action Buttons */}
				<div className="mt-8 flex gap-3">
					<button
						type="button"
						onClick={() => router.push(`/dashboard/${groupId}`)}
						className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{saving ? "Saving..." : "Save Plan"}
					</button>
				</div>
			</div>
		</div>
	);
}
