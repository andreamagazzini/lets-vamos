"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { Workout } from "@/lib/db";
import { useDashboardData } from "@/hooks/useDashboardData";
import LogWorkoutModal from "@/components/LogWorkoutModal";
import CountdownCard from "@/components/dashboard/CountdownCard";
import WeeklyPlanCard from "@/components/dashboard/WeeklyPlanCard";
import ProgressChart from "@/components/dashboard/ProgressChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import InviteSection from "@/components/dashboard/InviteSection";
import EditableEmoji from "@/components/dashboard/EditableEmoji";

export default function DashboardPage() {
	const params = useParams();
	const groupId = params.groupId as string;
	const [showLogModal, setShowLogModal] = useState(false);
	const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

	const {
		group,
		members,
		workouts,
		loading,
		handleSaveWorkout: saveWorkout,
		handleDeleteWorkout,
		handleUpdateGroup,
	} = useDashboardData(groupId);

	const handleLogWorkout = () => {
		setEditingWorkout(null);
		setShowLogModal(true);
	};

	const handleEditWorkout = (workout: Workout) => {
		setEditingWorkout(workout);
		setShowLogModal(true);
	};

	const handleSaveWorkout = async (
		workoutData: Omit<Workout, "id" | "createdAt">,
	) => {
		await saveWorkout(workoutData, editingWorkout);
		setShowLogModal(false);
		setEditingWorkout(null);
	};

	if (loading || !group) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-500">Loading...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			<div className="max-w-7xl mx-auto p-6 md:p-12">
				{/* Header */}
				<div className="mb-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
						<div className="flex items-center gap-3">
							<EditableEmoji
								emoji={group.emoji || "🏃"}
								onChange={(emoji) => handleUpdateGroup({ emoji })}
								size="lg"
							/>
							<h1 className="heading-lg text-black tracking-tight">
								{group.name}
							</h1>
						</div>
						<button
							onClick={handleLogWorkout}
							type="button"
							className="btn-primary text-base"
						>
							+ Log Workout
						</button>
					</div>

					<CountdownCard group={group} onUpdateGroup={handleUpdateGroup} />
				</div>

				{/* Weekly Plan Progress Chart */}
				<ProgressChart group={group} members={members} workouts={workouts} />

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					<WeeklyPlanCard group={group} onUpdateGroup={handleUpdateGroup} />
					<RecentActivity
						members={members}
						workouts={workouts}
						onEditWorkout={handleEditWorkout}
						onDeleteWorkout={handleDeleteWorkout}
					/>
				</div>

				<InviteSection group={group} />
			</div>

			{showLogModal && (
				<LogWorkoutModal
					groupId={groupId}
					members={members}
					workout={editingWorkout}
					onSave={handleSaveWorkout}
					onClose={() => {
						setShowLogModal(false);
						setEditingWorkout(null);
					}}
				/>
			)}
		</div>
	);
}
