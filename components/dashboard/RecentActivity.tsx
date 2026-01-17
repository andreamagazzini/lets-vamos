import {
	getRecentWorkouts,
	getWorkoutsByMemberId,
} from "@/lib/dashboard-utils";
import type { Member, Workout } from "@/lib/db";
import WorkoutCard from "./WorkoutCard";

interface RecentActivityProps {
	members: Member[];
	workouts: Workout[];
	onEditWorkout: (workout: Workout) => void;
	onDeleteWorkout: (workoutId: string) => void;
}

export default function RecentActivity({
	members,
	workouts,
	onEditWorkout,
	onDeleteWorkout,
}: RecentActivityProps) {
	const recentWorkouts = getRecentWorkouts(workouts);

	return (
		<div className="card-modern">
			<h2 className="heading-md text-black mb-6 tracking-tight">
				Recent Activity
			</h2>
			<div className="space-y-6">
				{members.length === 0 ? (
					<div className="text-gray-500 body-md text-center py-12">
						No members yet. Share the invite link to get started!
					</div>
				) : (
					<div className="space-y-6">
						{members.map((member) => {
							const memberWorkouts = getWorkoutsByMemberId(
								recentWorkouts,
								member.id,
							);
							return (
								<div
									key={member.id}
									className="border-b border-gray-100 last:border-0 pb-6 last:pb-0"
								>
									<div className="font-bold text-black mb-4 text-lg">
										{member.displayName}
									</div>
									{memberWorkouts.length > 0 ? (
										<div className="space-y-3">
											{memberWorkouts.map((workout) => (
												<WorkoutCard
													key={workout.id}
													workout={workout}
													onEdit={() => onEditWorkout(workout)}
													onDelete={() => onDeleteWorkout(workout.id)}
												/>
											))}
										</div>
									) : (
										<div className="text-gray-400 body-sm">
											No workouts logged this week
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
