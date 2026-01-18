import { Dumbbell, Plus, Trash2 } from 'lucide-react';
import type { Exercise } from '@/lib/db';

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
    field: 'reps' | 'weight',
    value: string
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
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Dumbbell className="w-5 h-5 text-primary" />
          Exercises
        </h3>
        <button
          type="button"
          onClick={onAddExercise}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary bg-primary/10 border-2 border-primary rounded-full hover:bg-primary hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Exercise
        </button>
      </div>

      {exercises.length === 0 && (
        <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Dumbbell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No exercises added yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Exercise" to get started</p>
        </div>
      )}

      {exercises.map((exercise, exerciseIndex) => (
        <div
          key={`exercise-${exerciseIndex}`}
          className="p-5 bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Exercise Header */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Exercise Name
              </label>
              <input
                type="text"
                value={exercise.name}
                onChange={(e) => onUpdateExerciseName(exerciseIndex, e.target.value)}
                placeholder="e.g., Bench Press, Squats, Deadlift"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50 hover:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => onRemoveExercise(exerciseIndex)}
              className="mt-6 p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200 hover:shadow-md"
              aria-label="Remove exercise"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {errors[`exercise-${exerciseIndex}-name`] && (
            <p className="mb-3 text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg">
              {errors[`exercise-${exerciseIndex}-name`]}
            </p>
          )}

          {/* Sets Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Sets
              </label>
              {exercise.sets.length > 0 && (
                <span className="text-xs text-gray-500 font-medium">
                  {exercise.sets.length} {exercise.sets.length === 1 ? 'set' : 'sets'}
                </span>
              )}
            </div>

            {exercise.sets.length === 0 ? (
              <div className="text-center py-6 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-xs text-gray-500 mb-2">No sets added</p>
                <button
                  type="button"
                  onClick={() => onAddSet(exerciseIndex)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add First Set
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={`set-${exerciseIndex}-${setIndex}`}
                    className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                      {setIndex + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="sr-only">Reps</label>
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                          placeholder="Reps"
                          className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                        />
                      </div>
                      <div>
                        <label className="sr-only">Weight</label>
                        <input
                          type="number"
                          step="0.5"
                          value={set.weight || ''}
                          onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                          placeholder="Weight (kg)"
                          className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveSet(exerciseIndex, setIndex)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 shrink-0"
                      aria-label={`Remove set ${setIndex + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errors[`exercise-${exerciseIndex}-sets`] && (
            <p className="mb-3 text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg">
              {errors[`exercise-${exerciseIndex}-sets`]}
            </p>
          )}

          {/* Add Set Button */}
          {exercise.sets.length > 0 && (
            <button
              type="button"
              onClick={() => onAddSet(exerciseIndex)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary bg-primary/5 border-2 border-dashed border-primary/30 rounded-xl hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Set
            </button>
          )}
        </div>
      ))}

      {errors.exercises && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600 font-medium">{errors.exercises}</p>
        </div>
      )}
    </div>
  );
}
