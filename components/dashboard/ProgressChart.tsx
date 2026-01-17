import { getWeeklyPlanProgress, getRecentWorkouts } from '@/lib/dashboard-utils';
import type { Group, Member, Workout } from '@/lib/db';

interface ProgressChartProps {
	group: Group;
	members: Member[];
	workouts: Workout[];
}

export default function ProgressChart({
	group,
	members,
	workouts,
}: ProgressChartProps) {
	if (members.length === 0) return null;

	return (
		<div className="card-modern mb-6">
			<h2 className="heading-md text-black mb-6 tracking-tight">
				Weekly Plan Progress
			</h2>
			<div className="space-y-6">
				{members.map((member) => {
					const progress = getWeeklyPlanProgress(group, member.id, workouts);
					return (
						<div key={member.id} className="space-y-2">
							<div className="flex items-center justify-between mb-2">
								<span className="font-semibold text-black">
									{member.displayName}
								</span>
								<span className="text-sm font-medium text-gray-600">
									{progress.completed}/{progress.total} workouts
									{progress.total > 0 && (
										<span className="ml-2 text-primary font-bold">
											{progress.percentage}%
										</span>
									)}
								</span>
							</div>
							{progress.total > 0 ? (
								<div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
									<div
										className={`h-full rounded-full transition-all duration-500 ${
											progress.percentage === 100
												? 'bg-success'
												: progress.percentage >= 70
													? 'bg-accent'
													: progress.percentage >= 40
														? 'bg-warning'
														: 'bg-red-400'
										}`}
										style={{ width: `${progress.percentage}%` }}
									/>
								</div>
							) : (
								<div className="text-gray-400 body-sm">
									No workouts planned for this week
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
