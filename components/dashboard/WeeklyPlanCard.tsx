"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Edit } from "lucide-react";
import { DAYS, getWeekPlan, getWeekKey, isToday } from "@/lib/dashboard-utils";
import type { Group, GroupPlanSettings, PlannedWorkout } from "@/lib/db";
import PlannedWorkoutItem from "./PlannedWorkoutItem";
import PlanSettingsModal from "./PlanSettingsModal";
import WeekNavigator from "./WeekNavigator";

interface WeeklyPlanCardProps {
	group: Group;
	onUpdateGroup: (updates: Partial<Group>) => void;
}

const DEFAULT_SETTINGS: GroupPlanSettings = {
	displayStyle: "expanded",
	showIcons: true,
	showDetails: true,
	colorTheme: "default",
	highlightToday: true,
};

export default function WeeklyPlanCard({
	group,
	onUpdateGroup,
}: WeeklyPlanCardProps) {
	const router = useRouter();
	const [showSettings, setShowSettings] = useState(false);
	const [currentWeekKey, setCurrentWeekKey] = useState(getWeekKey());
	const settings = group.planSettings || DEFAULT_SETTINGS;

	const weekPlanData = getWeekPlan(group, currentWeekKey);
	const weekPlan: Record<string, (string | PlannedWorkout)[]> = {};
	DAYS.forEach((day) => {
		weekPlan[day] = weekPlanData[day] || [];
	});

	const isUsingOverride = !!group.weeklyPlanOverrides?.[currentWeekKey];
	const isCurrentWeek = currentWeekKey === getWeekKey();

	const handleSaveSettings = (newSettings: GroupPlanSettings) => {
		onUpdateGroup({ planSettings: newSettings });
	};

	const handleEditPlan = () => {
		router.push(`/edit-plan/${group.id}?week=${currentWeekKey}`);
	};

	const handleToday = () => {
		setCurrentWeekKey(getWeekKey());
	};

	const shouldHighlightToday = settings.highlightToday && isCurrentWeek;

	return (
		<>
			<div className="card-modern">
				<div className="flex items-center justify-between mb-4">
					<h2 className="heading-md text-black tracking-tight">Weekly Plan</h2>
					<button
						type="button"
						onClick={() => setShowSettings(true)}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors"
						aria-label="Edit plan settings"
					>
						<Pencil className="w-4 h-4 text-gray-600" />
					</button>
				</div>

				<WeekNavigator
					currentWeekKey={currentWeekKey}
					onWeekChange={setCurrentWeekKey}
					onToday={handleToday}
				/>

				{isUsingOverride && (
					<div className="mb-4 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
						<p className="text-xs font-medium text-primary">
							Custom plan for this week
						</p>
					</div>
				)}
				<div className="space-y-2">
					{DAYS.map((day, index) => {
						const workouts = weekPlan[day] || [];
						const isTodayDay = shouldHighlightToday && isToday(index);

						return (
							<div
								key={day}
								className={`p-4 rounded-xl transition-all ${
									isTodayDay
										? "bg-primary text-white border-2 border-primary"
										: "bg-gray-50 border-2 border-gray-100 hover:border-primary/20"
								}`}
							>
								<div className="font-bold text-sm mb-2 tracking-wide">
									{day}
								</div>
								{workouts.length > 0 ? (
									<div
										className={`flex flex-wrap gap-2 ${
											isTodayDay ? "text-white" : ""
										}`}
									>
										{workouts.map((workout, i) => {
											const workoutKey =
												typeof workout === "string"
													? `workout-${day}-${i}-${workout}`
													: `workout-${day}-${i}-${workout.type}-${workout.description || ""}`;
											return (
												<PlannedWorkoutItem
													key={workoutKey}
													workout={workout}
													settings={settings}
													isToday={isTodayDay}
												/>
											);
										})}
									</div>
								) : (
									<div
										className={`body-sm ${
											isTodayDay ? "text-gray-300" : "text-gray-400"
										}`}
									>
										No workouts planned
									</div>
								)}
							</div>
						);
					})}
				</div>

				<div className="mt-6 pt-4 border-t border-gray-200">
					<button
						type="button"
						onClick={handleEditPlan}
						className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
						aria-label="Edit plan"
					>
						<Edit className="w-4 h-4" />
						Edit Plan
					</button>
				</div>
			</div>

			<PlanSettingsModal
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				onSave={handleSaveSettings}
				currentSettings={settings}
			/>
		</>
	);
}
