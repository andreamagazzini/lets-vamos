import { Dumbbell, Plus, Trash2 } from "lucide-react";
import type { Exercise } from "@/lib/db";

interface StrengthTrainingSectionProps {
	exercises: Exercise[];
	errors: Record<string, string>;
	onAddExercise: () => void;
	onRemoveExercise: (index: number) => void;
	onUpdateExerciseName: (index: number, name: string) => void;
	onAddSet: (exerciseIndex: number) => void;
	onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
	onUpdateSet: (
		exerciseIndex: number,
		setIndex: number,
		field: "reps" | "weight",
		value: string,
	) => void;
}

export default function StrengthTrainingSection({
	exercises,
	errors,
	onAddExercise,
	onRemoveExercise,
	onUpdateExerciseName,
	onAddSet,
	onRemoveSet,
	onUpdateSet,
}: StrengthTrainingSectionProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="flex items-center gap-2 text-sm font-semibold text-black">
					<Dumbbell className="w-4 h-4" />
					Exercises
				</h3>
				<button
					type="button"
					onClick={onAddExercise}
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
							onChange={(e) => onUpdateExerciseName(exerciseIndex, e.target.value)}
							placeholder="Exercise name (e.g., Squats)"
							className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-primary"
						/>
						<button
							type="button"
							onClick={() => onRemoveExercise(exerciseIndex)}
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
										onUpdateSet(exerciseIndex, setIndex, "reps", e.target.value)
									}
									placeholder="Reps"
									className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
								/>
								<input
									type="number"
									step="0.5"
									value={set.weight || ""}
									onChange={(e) =>
										onUpdateSet(exerciseIndex, setIndex, "weight", e.target.value)
									}
									placeholder="Weight (kg)"
									className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
								/>
								<button
									type="button"
									onClick={() => onRemoveSet(exerciseIndex, setIndex)}
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
						onClick={() => onAddSet(exerciseIndex)}
						className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
					>
						<Plus className="w-3 h-3" />
						Add Set
					</button>
				</div>
			))}

			{errors.exercises && (
				<p className="text-sm text-red-600 font-medium">{errors.exercises}</p>
			)}
		</div>
	);
}
