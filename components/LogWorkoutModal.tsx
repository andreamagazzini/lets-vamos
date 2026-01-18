'use client';

import { useUser } from '@clerk/nextjs';
import { Flame, Heart, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Group, Member, Workout } from '@/lib/db';
import DatePicker from './DatePicker';
import BasicWorkoutFields from './workout-form/BasicWorkoutFields';
import {
  buildWorkoutData,
  initializeFormState,
  validateWorkout,
  type WorkoutFormState,
} from './workout-form/workoutFormUtils';

interface LogWorkoutModalProps {
  groupId: string;
  group: Group | null;
  members: Member[];
  workout?: Workout | null;
  onSave: (workout: Omit<Workout, '_id' | 'createdAt'>) => void;
  onClose: () => void;
  onUpdateGroup?: (updates: Partial<Group>) => void;
}

export default function LogWorkoutModal({
  groupId,
  group,
  members,
  workout,
  onSave,
  onClose,
  onUpdateGroup,
}: LogWorkoutModalProps) {
  const { user } = useUser();
  const currentMember = user?.id ? members.find((m) => m.userId === user.id) : null;

  const [state, setState] = useState<WorkoutFormState>(() => initializeFormState(workout));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setState(initializeFormState(workout));
  }, [workout]);

  // Focus management for accessibility
  useEffect(() => {
    if (modalRef.current) {
      // Focus the modal when it opens
      const firstInput = modalRef.current.querySelector<HTMLElement>('input, select, textarea');
      firstInput?.focus();
    }
  }, []);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const updateState = (updates: Partial<WorkoutFormState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateWorkout(state);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus first error field
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = modalRef.current?.querySelector<HTMLElement>(
        `[aria-invalid="true"], #${firstErrorField}`
      );
      errorElement?.focus();
      return;
    }

    if (!currentMember) {
      setErrors({ form: 'You must be a member of this group to log workouts' });
      return;
    }

    const workoutData = buildWorkoutData(state, groupId, user?.id || '');
    onSave(workoutData);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 id="modal-title" className="heading-md text-black tracking-tight">
            Log Workout
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-black mb-3">
              Date
            </label>
            <DatePicker
              id="date"
              value={state.date}
              onChange={(date) => updateState({ date })}
              maxDate={new Date()}
              error={errors.date}
              aria-describedby={errors.date ? 'date-error' : undefined}
              aria-invalid={!!errors.date}
            />
            {errors.date && (
              <p id="date-error" className="mt-2 text-sm text-red-600 font-medium" role="alert">
                {errors.date}
              </p>
            )}
          </div>

          {/* Basic Workout Fields */}
          <BasicWorkoutFields
            group={group}
            type={state.type}
            amount={state.amount}
            unit={state.unit}
            duration={state.duration}
            onTypeChange={(type) => updateState({ type })}
            onAmountChange={(amount) => updateState({ amount })}
            onUnitChange={(unit) => updateState({ unit })}
            onDurationChange={(duration) => updateState({ duration })}
            showCustomType={true}
            onCustomTypeAdd={async (newType) => {
              // Add custom type to group
              if (group && onUpdateGroup) {
                const currentTypes = group.workoutTypes || [];
                if (!currentTypes.includes(newType)) {
                  onUpdateGroup({
                    workoutTypes: [...currentTypes, newType],
                  });
                }
              }
              updateState({ type: newType });
            }}
            errors={errors}
            showDuration={true}
          />

          {/* Calories and Avg Heart Rate - Available for all types */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="calories"
                className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
              >
                <Flame className="w-4 h-4" />
                Calories
              </label>
              <input
                id="calories"
                type="number"
                value={state.calories}
                onChange={(e) => updateState({ calories: e.target.value })}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
                placeholder="650"
              />
              {errors.calories && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.calories}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="avgHeartRate"
                className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
              >
                <Heart className="w-4 h-4" />
                <span className="md:hidden">Avg BPM</span>
                <span className="hidden md:inline">Avg Heart Rate (bpm)</span>
              </label>
              <input
                id="avgHeartRate"
                type="number"
                value={state.avgHeartRate}
                onChange={(e) => updateState({ avgHeartRate: e.target.value })}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
                placeholder="155"
              />
              {errors.avgHeartRate && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.avgHeartRate}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-black mb-3">
              Notes - Optional
            </label>
            <textarea
              id="notes"
              value={state.notes}
              onChange={(e) => updateState({ notes: e.target.value })}
              rows={3}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Felt great, good pace"
            />
          </div>

          {errors.form && (
            <p className="mt-2 text-sm text-red-600 font-medium" role="alert">
              {errors.form}
            </p>
          )}

          <button type="submit" className="btn-primary w-full text-lg">
            {workout ? 'Update Workout' : 'Log Workout'}
          </button>
        </form>
      </div>
    </div>
  );
}
