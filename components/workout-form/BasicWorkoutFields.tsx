'use client';

import { useEffect, useState } from 'react';
import { COMMON_UNITS } from '@/lib/constants';
import { getWorkoutTypes } from '@/lib/dashboard-utils';
import type { Group } from '@/lib/db';

interface BasicWorkoutFieldsProps {
  group: Group | null;
  type: string;
  amount?: number | string;
  unit?: string;
  duration?: number | string;
  onTypeChange: (type: string) => void;
  onAmountChange: (amount: string) => void;
  onUnitChange: (unit: string) => void;
  onDurationChange: (duration: string) => void;
  showCustomType?: boolean;
  onCustomTypeAdd?: (type: string) => void;
  errors?: Record<string, string>;
  showDuration?: boolean;
}

export default function BasicWorkoutFields({
  group,
  type,
  amount,
  unit,
  duration,
  onTypeChange,
  onAmountChange,
  onUnitChange,
  onDurationChange,
  showCustomType = false,
  onCustomTypeAdd,
  errors = {},
  showDuration = true,
}: BasicWorkoutFieldsProps) {
  const baseWorkoutTypes = getWorkoutTypes(group);
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [localCustomTypes, setLocalCustomTypes] = useState<string[]>([]);

  // Combine base types with locally added custom types
  const workoutTypes = [
    ...baseWorkoutTypes,
    ...localCustomTypes.filter((t) => !baseWorkoutTypes.includes(t)),
  ];

  // Sync local custom types with group - remove types that are now in the group
  useEffect(() => {
    setLocalCustomTypes((prev) => prev.filter((t) => !baseWorkoutTypes.includes(t)));
  }, [baseWorkoutTypes.includes]);

  const handleAddCustomType = async () => {
    const newType = customTypeInput.trim();
    if (newType && onCustomTypeAdd) {
      // Validate length (max 30 characters)
      if (newType.length > 30) {
        // Show error - you could add error state here if needed
        return;
      }

      // Add to local state immediately so it shows in the dropdown
      if (!workoutTypes.includes(newType)) {
        setLocalCustomTypes((prev) => [...prev, newType]);
      }

      // Call the parent handler (which may update the group)
      await onCustomTypeAdd(newType);

      setCustomTypeInput('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Workout Type */}
      <div>
        <label htmlFor="workout-type" className="block text-sm font-semibold text-black mb-3">
          Workout Type
        </label>
        <div className="flex gap-2">
          <select
            id="workout-type"
            value={type}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setShowCustomInput(true);
              } else {
                onTypeChange(e.target.value);
              }
            }}
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
                  // Limit to 30 characters
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

      {/* Amount and Unit */}
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
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Duration */}
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
    </div>
  );
}
