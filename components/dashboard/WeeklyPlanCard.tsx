import { DAYS, getCurrentWeekPlan, isToday } from '@/lib/dashboard-utils';
import type { Group } from '@/lib/db';

interface WeeklyPlanCardProps {
	group: Group;
}

export default function WeeklyPlanCard({ group }: WeeklyPlanCardProps) {
	const weekPlan = getCurrentWeekPlan(group);

	return (
		<div className="card-modern">
			<h2 className="heading-md text-black mb-6 tracking-tight">
				This Week's Plan
			</h2>
			<div className="space-y-2">
				{DAYS.map((day, index) => {
					const workouts = weekPlan[day] || [];
					const isTodayDay = isToday(index);

					return (
						<div
							key={day}
							className={`p-4 rounded-xl transition-all ${
								isTodayDay
									? 'bg-primary text-white border-2 border-primary'
									: 'bg-gray-50 border-2 border-gray-100 hover:border-primary/20'
							}`}
						>
							<div className="font-bold text-sm mb-2 tracking-wide">{day}</div>
							{workouts.length > 0 ? (
								<div
									className={`body-sm ${
										isTodayDay ? 'text-gray-200' : 'text-gray-700'
									}`}
								>
									{workouts.map((workout, i) => (
										<div key={i} className="mb-1">
											{workout}
										</div>
									))}
								</div>
							) : (
								<div
									className={`body-sm ${
										isTodayDay ? 'text-gray-300' : 'text-gray-400'
									}`}
								>
									No workouts planned
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
