'use client';

import { useEffect, useState } from 'react';
import { getWorkoutTypes } from '@/lib/dashboard-utils';
import type { Exercise, Group, Interval } from '@/lib/db';
import IntervalsSection from './IntervalsSection';
import StrengthTrainingSection from './StrengthTrainingSection';

interface WorkoutFieldsProps {
  group: Group | null;
  type: string;
  amount?: number | string;
  unit?: string;
  duration?: number | string;
  notes?: string;
  intervals?: Interval[];
  exercises?: Exercise[];
  avgPace?: number | string; // min/km for Run
  onTypeChange: (type: string) => void;
  onAmountChange: (amount: string) => void;
  onUnitChange: (unit: string) => void;
  onDurationChange: (duration: string) => void;
  onNotesChange?: (notes: string) => void;
  onIntervalsChange?: (intervals: Interval[]) => void;
  onExercisesChange?: (exercises: Exercise[]) => void;
  onAvgPaceChange?: (avgPace: string) => void;
  showCustomType?: boolean;
  onCustomTypeAdd?: (type: string) => void;
  errors?: Record<string, string>;
  showDuration?: boolean;
  // For intervals/exercises handlers
  onAddInterval?: () => void;
  onRemoveInterval?: (index: number) => void;
  onUpdateInterval?: (index: number, field: keyof Interval, value: string | number | undefined) => void;
  onAddExercise?: () => void;
  onRemoveExercise?: (index: number) => void;
  onUpdateExerciseName?: (index: number, name: string) => void;
  onAddSet?: (exerciseIndex: number) => void;
  onRemoveSet?: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSet?: (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) => void;
  intervalsExpanded?: boolean;
  onToggleIntervals?: () => void;
}

export default function WorkoutFields({
  group,
  type,
  amount,
  unit,
  duration,
  notes,
  intervals = [],
  exercises = [],
  avgPace,
  onTypeChange,
  onAmountChange,
  onUnitChange,
  onDurationChange,
  onNotesChange,
  onIntervalsChange,
  onExercisesChange,
  onAvgPaceChange,
  showCustomType = false,
  onCustomTypeAdd,
  errors = {},
  showDuration = true,
  onAddInterval,
  onRemoveInterval,
  onUpdateInterval,
  onAddExercise,
  onRemoveExercise,
  onUpdateExerciseName,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  intervalsExpanded = false,
  onToggleIntervals,
}: WorkoutFieldsProps) {
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [localCustomTypes, setLocalCustomTypes] = useState<string[]>([]);
  const [localIntervalsExpanded, setLocalIntervalsExpanded] = useState(intervalsExpanded);

  const baseWorkoutTypes = getWorkoutTypes(group);
  const workoutTypes = [
    ...baseWorkoutTypes,
    ...localCustomTypes.filter((t) => !baseWorkoutTypes.includes(t)),
  ];

  useEffect(() => {
    setLocalCustomTypes((prev) => prev.filter((t) => !baseWorkoutTypes.includes(t)));
  }, [baseWorkoutTypes]);

  useEffect(() => {
    setLocalIntervalsExpanded(intervals.length > 0);
  }, [intervals.length]);

  const handleAddCustomType = async () => {
    const newType = customTypeInput.trim();
    if (newType && onCustomTypeAdd) {
      if (newType.length > 30) {
        return;
      }

      if (!workoutTypes.includes(newType)) {
        setLocalCustomTypes((prev) => [...prev, newType]);
      }

      await onCustomTypeAdd(newType);
      setCustomTypeInput('');
      setShowCustomInput(false);
    }
  };

  const handleTypeChange = (newType: string) => {
    if (newType === '__custom__') {
      setShowCustomInput(true);
      return;
    }

    // Clear intervals/exercises when switching types
    if (onIntervalsChange && newType !== 'Run' && newType !== 'Bike' && newType !== 'Swim') {
      onIntervalsChange([]);
    }
    if (onExercisesChange && newType !== 'Strength') {
      onExercisesChange([]);
    }

    onTypeChange(newType);
  };

  // Default handlers if not provided
  const handleAddInterval = () => {
    if (onAddInterval) {
      onAddInterval();
    } else if (onIntervalsChange) {
      onIntervalsChange([...intervals, { type: 'warmup' as const, repeats: undefined }]);
    }
    setLocalIntervalsExpanded(true);
  };

  const handleRemoveInterval = (index: number) => {
    if (onRemoveInterval) {
      onRemoveInterval(index);
    } else if (onIntervalsChange) {
      onIntervalsChange(intervals.filter((_, i) => i !== index));
    }
  };

  const handleUpdateInterval = (
    index: number,
    field: keyof Interval,
    value: string | number | undefined
  ) => {
    if (onUpdateInterval) {
      onUpdateInterval(index, field, value);
    } else if (onIntervalsChange) {
      onIntervalsChange(
        intervals.map((interval, i) => (i === index ? { ...interval, [field]: value } : interval))
      );
    }
  };

  const handleAddExercise = () => {
    if (onAddExercise) {
      onAddExercise();
    } else if (onExercisesChange) {
      onExercisesChange([...exercises, { name: '', sets: [] }]);
    }
  };

  const handleRemoveExercise = (index: number) => {
    if (onRemoveExercise) {
      onRemoveExercise(index);
    } else if (onExercisesChange) {
      onExercisesChange(exercises.filter((_, i) => i !== index));
    }
  };

  const handleUpdateExerciseName = (index: number, name: string) => {
    if (onUpdateExerciseName) {
      onUpdateExerciseName(index, name);
    } else if (onExercisesChange) {
      onExercisesChange(
        exercises.map((exercise, i) => (i === index ? { ...exercise, name } : exercise))
      );
    }
  };

  const handleAddSet = (exerciseIndex: number) => {
    if (onAddSet) {
      onAddSet(exerciseIndex);
    } else if (onExercisesChange) {
      onExercisesChange(
        exercises.map((exercise, i) =>
          i === exerciseIndex ? { ...exercise, sets: [...exercise.sets, {}] } : exercise
        )
      );
    }
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    if (onRemoveSet) {
      onRemoveSet(exerciseIndex, setIndex);
    } else if (onExercisesChange) {
      onExercisesChange(
        exercises.map((exercise, i) =>
          i === exerciseIndex
            ? { ...exercise, sets: exercise.sets.filter((_, si) => si !== setIndex) }
            : exercise
        )
      );
    }
  };

  const handleUpdateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: string
  ) => {
    if (onUpdateSet) {
      onUpdateSet(exerciseIndex, setIndex, field, value);
    } else if (onExercisesChange) {
      onExercisesChange(
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
    }
  };

  const isIntervalsExpanded = onToggleIntervals ? intervalsExpanded : localIntervalsExpanded;
  const toggleIntervals = onToggleIntervals || (() => setLocalIntervalsExpanded(!localIntervalsExpanded));

  return (
    <div className="space-y-4">
      {/* Workout Type Selector */}
      <div>
        <label htmlFor="workout-type" className="block text-sm font-semibold text-black mb-3">
          Workout Type
        </label>
        <div className="flex gap-2">
          <select
            id="workout-type"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
            aria-describedby={errors.type ? 'type-error' : undefined}
            aria-invalid={!!errors.type}
          >
            {workoutTypes
              .filter((t) => t !== 'Rest')
              .map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            {showCustomType && <option value="__custom__">+ Add Custom Type</option>}
          </select>
        </div>
        {showCustomInput && (
          <div className="mt-2 space-y-2">
            <div>
              <input
                type="text"
                value={customTypeInput}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 30) {
                    setCustomTypeInput(value);
                  }
                }}
                placeholder="Enter custom workout type"
                maxLength={30}
                className="w-full px-4 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomType();
                  } else if (e.key === 'Escape') {
                    setShowCustomInput(false);
                    setCustomTypeInput('');
                  }
                }}
              />
              <p className="mt-1 text-xs text-gray-500 text-right">
                {customTypeInput.length}/30 characters
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddCustomType}
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomTypeInput('');
                }}
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {errors.type && (
          <p id="type-error" className="mt-2 text-sm text-red-600 font-medium" role="alert">
            {errors.type}
          </p>
        )}
      </div>

      {/* Amount and Unit - Only for non-Strength types */}
      {type !== 'Strength' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="workout-amount" className="block text-sm font-semibold text-black mb-3">
              Amount
            </label>
            <input
              id="workout-amount"
              type="number"
              step="0.01"
              value={amount || ''}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="e.g., 5"
              className="w-full px-6 py-4 h-[56px] border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
              aria-describedby={errors.amount ? 'amount-error' : undefined}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && (
              <p id="amount-error" className="mt-2 text-sm text-red-600 font-medium" role="alert">
                {errors.amount}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="workout-unit" className="block text-sm font-semibold text-black mb-3">
              Unit
            </label>
            <select
              id="workout-unit"
              value={unit || ''}
              onChange={(e) => onUnitChange(e.target.value)}
              className="w-full px-6 py-4 h-[56px] border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
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

      {/* Average Pace - Run only */}
      {type === 'Run' && onAvgPaceChange && (
        <div>
          <label htmlFor="workout-avg-pace" className="block text-sm font-semibold text-black mb-3">
            Average Pace (min/km)
          </label>
          <input
            id="workout-avg-pace"
            type="number"
            step="0.1"
            value={avgPace || ''}
            onChange={(e) => onAvgPaceChange(e.target.value)}
            placeholder="e.g., 4.5"
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
            aria-describedby={errors.avgPace ? 'avgPace-error' : undefined}
            aria-invalid={!!errors.avgPace}
          />
          {errors.avgPace && (
            <p id="avgPace-error" className="mt-2 text-sm text-red-600 font-medium" role="alert">
              {errors.avgPace}
            </p>
          )}
        </div>
      )}

      {/* Intervals Section for Run/Bike/Swim */}
      {(type === 'Run' || type === 'Bike' || type === 'Swim') && (
        <IntervalsSection
          type={type as 'Run' | 'Bike' | 'Swim'}
          intervals={intervals}
          expanded={isIntervalsExpanded}
          onToggle={toggleIntervals}
          onAdd={handleAddInterval}
          onRemove={handleRemoveInterval}
          onUpdate={handleUpdateInterval}
        />
      )}

      {/* Strength Training Section */}
      {type === 'Strength' && (
        <StrengthTrainingSection
          exercises={exercises}
          errors={errors}
          onAddExercise={handleAddExercise}
          onRemoveExercise={handleRemoveExercise}
          onUpdateExerciseName={handleUpdateExerciseName}
          onAddSet={handleAddSet}
          onRemoveSet={handleRemoveSet}
          onUpdateSet={handleUpdateSet}
        />
      )}

      {/* Duration - Available for all types */}
      {showDuration && (
        <div>
          <label htmlFor="workout-duration" className="block text-sm font-semibold text-black mb-3">
            Duration (minutes)
          </label>
          <input
            id="workout-duration"
            type="number"
            step="1"
            value={duration || ''}
            onChange={(e) => onDurationChange(e.target.value)}
            placeholder="e.g., 30"
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
            aria-describedby={errors.duration ? 'duration-error' : undefined}
            aria-invalid={!!errors.duration}
          />
          {errors.duration && (
            <p id="duration-error" className="mt-2 text-sm text-red-600 font-medium" role="alert">
              {errors.duration}
            </p>
          )}
        </div>
      )}

      {/* Notes - Available for all types (if not already shown in intervals/exercises) */}
      {onNotesChange && (
        <div>
          <label htmlFor="workout-notes" className="block text-sm font-semibold text-black mb-3">
            Notes (optional)
          </label>
          <textarea
            id="workout-notes"
            value={notes || ''}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="e.g., Easy pace, Upper body focus"
            rows={3}
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>
      )}
    </div>
  );
}
