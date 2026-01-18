'use client';

import { Activity, Bike, Dumbbell, Footprints, Waves, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getWorkoutTypes } from '@/lib/dashboard-utils';
import type { Exercise, Group, Interval, PlannedWorkout } from '@/lib/db';
import BasicWorkoutFields from './BasicWorkoutFields';
import IntervalsSection from './IntervalsSection';
import StrengthTrainingSection from './StrengthTrainingSection';

interface PlannedWorkoutEditorProps {
  workout: string | PlannedWorkout;
  group: Group | null;
  onUpdate: (workout: string | PlannedWorkout) => void;
  onDelete: () => void;
  onUpdateGroup?: (updates: Partial<Group>) => void;
}

function getWorkoutIcon(type: string) {
  switch (type) {
    case 'Run':
      return <Footprints className="w-4 h-4" />;
    case 'Bike':
      return <Bike className="w-4 h-4" />;
    case 'Swim':
      return <Waves className="w-4 h-4" />;
    case 'Strength':
      return <Dumbbell className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
}

export default function PlannedWorkoutEditor({
  workout,
  group,
  onUpdate,
  onDelete,
  onUpdateGroup,
}: PlannedWorkoutEditorProps) {
  const isString = typeof workout === 'string';
  const isEmpty = workout === '' || (isString && workout.trim() === '');
  const [isEditing, setIsEditing] = useState(isEmpty);

  const [type, setType] = useState<string>(isString ? 'Run' : workout.type);
  const [duration, setDuration] = useState(isString ? '' : workout.duration?.toString() || '');
  const [amount, setAmount] = useState(isString ? '' : workout.amount?.toString() || '');
  const [unit, setUnit] = useState(isString ? '' : workout.unit || '');
  // Migrate description to notes for backward compatibility
  const [notes, setNotes] = useState(
    isString ? workout : workout.notes || (workout as any).description || ''
  );
  const [intervals, setIntervals] = useState<Interval[]>(
    isString ? [] : workout.intervals || []
  );
  const [exercises, setExercises] = useState<Exercise[]>(
    isString ? [] : workout.exercises || []
  );
  const [intervalsExpanded, setIntervalsExpanded] = useState(false);

  // Update state when workout prop changes (important for custom types)
  useEffect(() => {
    if (!isString && workout.type) {
      setType(workout.type);
      setIntervals(workout.intervals || []);
      setExercises(workout.exercises || []);
      setIntervalsExpanded((workout.intervals?.length || 0) > 0);
    }
  }, [workout, isString]);

  const handleSave = () => {
    if (type === 'Rest') {
      onUpdate({ type: 'Rest' });
    } else if (notes.trim() || duration || amount || intervals.length > 0 || exercises.length > 0) {
      const plannedWorkout: PlannedWorkout = {
        type,
        duration: duration ? parseInt(duration, 10) : undefined,
        amount: amount ? parseFloat(amount) : undefined,
        unit: unit || undefined,
        notes: notes.trim() || undefined,
        intervals: intervals.length > 0 ? intervals : undefined,
        exercises: exercises.length > 0 ? exercises : undefined,
      };
      onUpdate(plannedWorkout);
    } else {
      // Fallback to string if no structured data
      onUpdate(notes.trim() || 'Workout');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original values
    if (typeof workout === 'string') {
      setNotes(workout);
      setType('Run');
      setAmount('');
      setUnit('');
      setIntervals([]);
      setExercises([]);
    } else {
      setType(workout.type);
      // Migrate description to notes for backward compatibility
      setNotes(workout.notes || (workout as any).description || '');
      setDuration(workout.duration?.toString() || '');
      setAmount(workout.amount?.toString() || '');
      setUnit(workout.unit || '');
      setIntervals(workout.intervals || []);
      setExercises(workout.exercises || []);
    }
    setIntervalsExpanded(false);
    setIsEditing(false);
  };

  if (!isEditing) {
    const workoutType = typeof workout === 'object' ? workout.type : type;
    const workoutTypeName =
      typeof workout === 'string' ? workout : workout.type === 'Rest' ? 'Rest Day' : workout.type;

    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="w-full text-left p-2 bg-white rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getWorkoutIcon(workoutType)}
              <span className="text-sm font-medium text-gray-700">{workoutTypeName}</span>
            </div>
            {typeof workout === 'object' && workout.amount && (
              <div className="text-xs text-gray-500 ml-6">
                {workout.amount} {workout.unit || 'km'}
              </div>
            )}
            {/* Backward compatibility: show distance if amount not available */}
            {typeof workout === 'object' && !workout.amount && (workout as any).distance && (
              <div className="text-xs text-gray-500 ml-6">{(workout as any).distance} km</div>
            )}
            {typeof workout === 'object' && workout.notes && (
              <div className="text-xs text-gray-500 ml-6 mt-0.5">{workout.notes}</div>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Workout</h3>
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {type !== 'Rest' && (
            <>
              {/* Workout Type Selector */}
              <div>
                <label htmlFor="workout-type" className="block text-xs font-medium text-gray-600 mb-1">
                  Workout Type
                </label>
                <select
                  id="workout-type"
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    if (newType === '__custom__') {
                      const customType = prompt('Enter custom workout type (max 30 characters):');
                      if (customType && customType.trim() && customType.length <= 30) {
                        if (group && onUpdateGroup) {
                          const currentTypes = group.workoutTypes || [];
                          if (!currentTypes.includes(customType.trim())) {
                            onUpdateGroup({
                              workoutTypes: [...currentTypes, customType.trim()],
                            });
                          }
                        }
                        setType(customType.trim());
                      }
                      return;
                    }
                    // Clear intervals/exercises when switching types
                    setType(newType);
                    if (newType !== 'Run' && newType !== 'Bike' && newType !== 'Swim') {
                      setIntervals([]);
                    }
                    if (newType !== 'Strength') {
                      setExercises([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  {getWorkoutTypes(group)
                    .filter((t) => t !== 'Rest')
                    .map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  <option value="__custom__">+ Add Custom Type</option>
                </select>
              </div>

              {/* Amount and Unit - Only for non-Strength types */}
              {type !== 'Strength' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="workout-amount" className="block text-xs font-medium text-gray-600 mb-1">
                      Amount
                    </label>
                    <input
                      id="workout-amount"
                      type="number"
                      step="0.01"
                      value={amount || ''}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g., 5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="workout-unit" className="block text-xs font-medium text-gray-600 mb-1">
                      Unit
                    </label>
                    <select
                      id="workout-unit"
                      value={unit || ''}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">Select unit</option>
                      {['km', 'mi', 'm', 'yd', 'min', 'hr'].map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Intervals Section for Run/Bike/Swim */}
              {(type === 'Run' || type === 'Bike' || type === 'Swim') && (
                <IntervalsSection
                  type={type as 'Run' | 'Bike' | 'Swim'}
                  intervals={intervals}
                  expanded={intervalsExpanded}
                  onToggle={() => setIntervalsExpanded(!intervalsExpanded)}
                  onAdd={() => {
                    setIntervals([...intervals, { type: 'warmup' as const }]);
                    setIntervalsExpanded(true);
                  }}
                  onRemove={(index) => setIntervals(intervals.filter((_, i) => i !== index))}
                  onUpdate={(index, field, value) => {
                    setIntervals(
                      intervals.map((interval, i) =>
                        i === index ? { ...interval, [field]: value } : interval
                      )
                    );
                  }}
                />
              )}

              {/* Strength Training Section */}
              {type === 'Strength' && (
                <StrengthTrainingSection
                  exercises={exercises}
                  errors={{}}
                  onAddExercise={() => setExercises([...exercises, { name: '', sets: [] }])}
                  onRemoveExercise={(index) => setExercises(exercises.filter((_, i) => i !== index))}
                  onUpdateExerciseName={(index, name) => {
                    setExercises(
                      exercises.map((exercise, i) => (i === index ? { ...exercise, name } : exercise))
                    );
                  }}
                  onAddSet={(exerciseIndex) => {
                    setExercises(
                      exercises.map((exercise, i) =>
                        i === exerciseIndex
                          ? { ...exercise, sets: [...exercise.sets, {}] }
                          : exercise
                      )
                    );
                  }}
                  onRemoveSet={(exerciseIndex, setIndex) => {
                    setExercises(
                      exercises.map((exercise, i) =>
                        i === exerciseIndex
                          ? { ...exercise, sets: exercise.sets.filter((_, si) => si !== setIndex) }
                          : exercise
                      )
                    );
                  }}
                  onUpdateSet={(exerciseIndex, setIndex, field, value) => {
                    setExercises(
                      exercises.map((exercise, i) =>
                        i === exerciseIndex
                          ? {
                              ...exercise,
                              sets: exercise.sets.map((set, si) =>
                                si === setIndex
                                  ? {
                                      ...set,
                                      [field]:
                                        value === ''
                                          ? undefined
                                          : field === 'reps'
                                            ? parseInt(value, 10)
                                            : parseFloat(value),
                                    }
                                  : set
                              ),
                            }
                          : exercise
                      )
                    );
                  }}
                />
              )}

              {/* Duration - Available for all types */}
              <div>
                <label htmlFor="workout-duration" className="block text-xs font-medium text-gray-600 mb-1">
                  Duration (minutes)
                </label>
                <input
                  id="workout-duration"
                  type="number"
                  step="1"
                  value={duration || ''}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* Notes - Available for all types */}
              <div>
                <label
                  htmlFor="workout-notes"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="workout-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Easy pace, Upper body focus"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onDelete}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
