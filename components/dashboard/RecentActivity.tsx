import { getRecentWorkouts, getWorkoutsByMemberId, formatDate } from '@/lib/dashboard-utils';
import type { Member, Workout } from '@/lib/db';

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
												<div
													key={workout.id}
													className="flex items-start justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
												>
													<div className="flex-1">
														<div className="text-black body-sm font-medium mb-1">
															<span className="text-success mr-2">✓</span>
															{formatDate(workout.date)}: {workout.type}
															{workout.type === 'Strength' ? (
																<>
																	{workout.exercises && workout.exercises.length > 0 && (
																		<> - {workout.exercises.length} exercise{workout.exercises.length > 1 ? 's' : ''}</>
																	)}
																	{workout.exercises && workout.exercises.length > 0 && (
																		<> ({workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)} sets)</>
																	)}
																	{workout.duration && `, ${workout.duration} min`}
																</>
															) : workout.type === 'Run' || workout.type === 'Bike' || workout.type === 'Swim' ? (
																<>
																	{workout.distance && (
																		<>, {workout.distance}{workout.type === 'Swim' ? 'm' : 'km'}
																		</>
																	)}
																	{workout.duration && `, ${workout.duration} min`}
																	{workout.calories && `, ${workout.calories} cal`}
																	{workout.avgHeartRate && `, ${workout.avgHeartRate} bpm`}
																	{workout.type === 'Bike' && workout.avgSpeed && `, ${workout.avgSpeed} km/h`}
																	{workout.type === 'Swim' && workout.laps && `, ${workout.laps} laps`}
																	{workout.type === 'Swim' && workout.poolLength && ` (${workout.poolLength}m pool)`}
																	{workout.intervals && workout.intervals.length > 0 && (
																		<>, {workout.intervals.length} interval{workout.intervals.length > 1 ? 's' : ''}
																		</>
																	)}
																</>
															) : (
																<>
																	{workout.duration && `, ${workout.duration} min`}
																</>
															)}
														</div>
														{workout.notes && (
															<div className="text-gray-500 body-xs mt-1">
																{workout.notes}
															</div>
														)}
													</div>
													<div className="flex gap-3 ml-4">
														<button
															onClick={() => onEditWorkout(workout)}
															type="button"
															className="text-primary hover:text-primary-dark text-xs font-medium transition-colors"
														>
															Edit
														</button>
														<button
															onClick={() => onDeleteWorkout(workout.id)}
															type="button"
															className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
														>
															Delete
														</button>
													</div>
												</div>
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
