import {
	getRecentWorkouts,
	getWorkoutsByMemberId,
	formatDate,
} from "@/lib/dashboard-utils";
import type { Member, Workout } from "@/lib/db";
import {
	Footprints,
	Bike,
	Waves,
	Dumbbell,
	Activity,
	Clock,
	MapPin,
	Flame,
	Heart,
	Gauge,
	Zap,
	Pencil,
	Trash2,
} from "lucide-react";

interface RecentActivityProps {
	members: Member[];
	workouts: Workout[];
	onEditWorkout: (workout: Workout) => void;
	onDeleteWorkout: (workoutId: string) => void;
}

function getWorkoutIcon(type: string) {
	switch (type) {
		case "Run":
			return <Footprints className="w-5 h-5" />;
		case "Bike":
			return <Bike className="w-5 h-5" />;
		case "Swim":
			return <Waves className="w-5 h-5" />;
		case "Strength":
			return <Dumbbell className="w-5 h-5" />;
		default:
			return <Activity className="w-5 h-5" />;
	}
}

function getWorkoutColor(type: string) {
	switch (type) {
		case "Run":
			return {
				bg: "bg-primary-light/10",
				border: "border-primary-light/30",
				text: "text-primary",
				icon: "text-primary-light",
			};
		case "Bike":
			return {
				bg: "bg-primary/5",
				border: "border-primary/20",
				text: "text-primary",
				icon: "text-primary",
			};
		case "Swim":
			return {
				bg: "bg-accent/10",
				border: "border-accent/30",
				text: "text-primary",
				icon: "text-accent",
			};
		case "Strength":
			return {
				bg: "bg-gray-50",
				border: "border-gray-200",
				text: "text-gray-700",
				icon: "text-gray-600",
			};
		default:
			return {
				bg: "bg-gray-50",
				border: "border-gray-200",
				text: "text-gray-700",
				icon: "text-gray-600",
			};
	}
}

function WorkoutCard({
	workout,
	onEdit,
	onDelete,
}: {
	workout: Workout;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const icon = getWorkoutIcon(workout.type);
	const colors = getWorkoutColor(workout.type);
	const isCardio =
		workout.type === "Run" ||
		workout.type === "Bike" ||
		workout.type === "Swim";

	return (
		<div
			className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${colors.bg} ${colors.border} ${colors.text}`}
		>
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3 flex-1">
					<div className={`p-2 rounded-lg bg-white/60 ${colors.icon}`}>
						{icon}
					</div>
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-1">
							<span className="text-success text-lg">✓</span>
							<span className="font-bold text-sm">{workout.type}</span>
							<span className="text-xs opacity-70">
								{formatDate(workout.date)}
							</span>
						</div>

						{/* Cardio Workout Details */}
						{isCardio && (
							<div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
								{workout.distance && (
									<div className="flex items-center gap-1">
										<MapPin className="w-3 h-3" />
										<span>
											{workout.distance}
											{workout.type === "Swim" ? "m" : "km"}
										</span>
									</div>
								)}
								{workout.duration && (
									<div className="flex items-center gap-1">
										<Clock className="w-3 h-3" />
										<span>{workout.duration} min</span>
									</div>
								)}
								{workout.calories && (
									<div className="flex items-center gap-1">
										<Flame className="w-3 h-3" />
										<span>{workout.calories} cal</span>
									</div>
								)}
								{workout.avgHeartRate && (
									<div className="flex items-center gap-1">
										<Heart className="w-3 h-3" />
										<span>{workout.avgHeartRate} bpm</span>
									</div>
								)}
								{workout.type === "Bike" && workout.avgSpeed && (
									<div className="flex items-center gap-1">
										<Gauge className="w-3 h-3" />
										<span>{workout.avgSpeed} km/h</span>
									</div>
								)}
								{workout.type === "Swim" && workout.laps && (
									<div className="flex items-center gap-1">
										<Waves className="w-3 h-3" />
										<span>{workout.laps} laps</span>
									</div>
								)}
								{workout.type === "Swim" && workout.poolLength && (
									<span className="opacity-70">
										({workout.poolLength}m pool)
									</span>
								)}
								{workout.intervals && workout.intervals.length > 0 && (
									<div className="flex items-center gap-1">
										<Zap className="w-3 h-3" />
										<span>
											{workout.intervals.length} interval
											{workout.intervals.length > 1 ? "s" : ""}
										</span>
									</div>
								)}
							</div>
						)}

						{/* Strength Workout Details */}
						{workout.type === "Strength" &&
							workout.exercises &&
							workout.exercises.length > 0 && (
								<div className="mt-2 space-y-1">
									<div className="flex items-center gap-2 text-xs">
										<Dumbbell className="w-3 h-3" />
										<span className="font-medium">
											{workout.exercises.length} exercise
											{workout.exercises.length > 1 ? "s" : ""}
										</span>
										<span className="opacity-70">•</span>
										<span>
											{workout.exercises.reduce(
												(total, ex) => total + ex.sets.length,
												0,
											)}{" "}
											sets
										</span>
									</div>
									{workout.duration && (
										<div className="flex items-center gap-1 text-xs">
											<Clock className="w-3 h-3" />
											<span>{workout.duration} min</span>
										</div>
									)}
									<div className="text-xs mt-1 opacity-80">
										{workout.exercises
											.slice(0, 3)
											.map((ex) => ex.name)
											.join(", ")}
										{workout.exercises.length > 3 &&
											` +${workout.exercises.length - 3} more`}
									</div>
								</div>
							)}

						{/* Other Workout Details */}
						{workout.type === "Other" && workout.duration && (
							<div className="flex items-center gap-1 mt-2 text-xs">
								<Clock className="w-3 h-3" />
								<span>{workout.duration} min</span>
							</div>
						)}

						{workout.notes && (
							<div className="text-xs mt-2 opacity-80 italic">
								"{workout.notes}"
							</div>
						)}
					</div>
				</div>

				<div className="flex gap-1.5 ml-2">
					<button
						onClick={onEdit}
						type="button"
						className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-200 opacity-60 hover:opacity-100"
						aria-label="Edit workout"
					>
						<Pencil className="w-4 h-4" />
					</button>
					<button
						onClick={onDelete}
						type="button"
						className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 opacity-60 hover:opacity-100"
						aria-label="Delete workout"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
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
