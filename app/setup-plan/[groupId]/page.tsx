'use client';

import { Plus, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/components/Toast';
import BasicWorkoutFields from '@/components/workout-form/BasicWorkoutFields';
import IntervalsSection from '@/components/workout-form/IntervalsSection';
import StrengthTrainingSection from '@/components/workout-form/StrengthTrainingSection';
import { DAYS } from '@/lib/constants';
import { getWorkoutTypes } from '@/lib/dashboard-utils';
import type { Exercise, Group, Interval, PlannedWorkout, WeeklyPlan } from '@/lib/db';
import { getErrorMessage, handleAsync } from '@/lib/error-handler';

export default function SetupPlanPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<WeeklyPlan>({});
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [workoutForm, setWorkoutForm] = useState<{
    type: string;
    amount: string;
    unit: string;
    duration: string;
    notes: string;
    intervals: Interval[];
    exercises: Exercise[];
  }>({
    type: 'Run',
    amount: '',
    unit: '',
    duration: '',
    notes: '',
    intervals: [],
    exercises: [],
  });
  const [intervalsExpanded, setIntervalsExpanded] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadedGroupIdRef = useRef<string | null>(null);

  const loadGroup = useCallback(async () => {
    if (!groupId) return;

    // Prevent reloading if we already have this group loaded
    if (loadedGroupIdRef.current === groupId) {
      return;
    }

    setLoading(true);
    const { data: response, error } = await handleAsync(async () => {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load group');
      }
      return await res.json();
    }, 'loadGroup');

    if (error || !response?.group) {
      toast.error('Failed to load group');
      router.push('/');
      setLoading(false);
      return;
    }

    setGroup(response.group);
    setTrainingPlan(response.group.trainingPlan || {});
    loadedGroupIdRef.current = groupId;
    setLoading(false);
  }, [groupId, router, toast]);

  useEffect(() => {
    if (groupId && loadedGroupIdRef.current !== groupId) {
      loadGroup();
    }
    // Only run when groupId changes, not when loadGroup changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, loadGroup]);

  const handleAddWorkout = (day: string) => {
    setEditingDay(day);
    setEditingIndex(null);
    setWorkoutForm({
      type: 'Run',
      amount: '',
      unit: '',
      duration: '',
      notes: '',
      intervals: [],
      exercises: [],
    });
    setIntervalsExpanded(false);
  };

  const handleEditWorkout = (day: string, index: number) => {
    const workouts = trainingPlan[day] || [];
    const workout = workouts[index];

    if (typeof workout === 'string') {
      setWorkoutForm({
        type: 'Run',
        amount: '',
        unit: '',
        duration: '',
        notes: workout,
        intervals: [],
        exercises: [],
      });
    } else {
      setWorkoutForm({
        type: workout.type,
        amount: workout.amount?.toString() || '',
        unit: workout.unit || '',
        duration: workout.duration?.toString() || '',
        notes: workout.notes || '',
        intervals: workout.intervals || [],
        exercises: workout.exercises || [],
      });
    }
    setEditingDay(day);
    setEditingIndex(index);
    setIntervalsExpanded((workout as PlannedWorkout)?.intervals?.length > 0 || false);
  };

  const handleSaveWorkout = () => {
    if (!editingDay) return;

    const day = editingDay;
    const newPlan = { ...trainingPlan };
    if (!newPlan[day]) {
      newPlan[day] = [];
    }

    // Create structured workout
    const plannedWorkout: PlannedWorkout = {
      type: workoutForm.type,
      duration: workoutForm.duration ? parseInt(workoutForm.duration, 10) : undefined,
      amount: workoutForm.amount ? parseFloat(workoutForm.amount) : undefined,
      unit: workoutForm.unit || undefined,
      notes: workoutForm.notes.trim() || undefined,
      intervals: workoutForm.intervals.length > 0 ? workoutForm.intervals : undefined,
      exercises: workoutForm.exercises.length > 0 ? workoutForm.exercises : undefined,
    };

    if (editingIndex !== null) {
      // Update existing workout
      newPlan[day][editingIndex] = plannedWorkout;
    } else {
      // Add new workout
      newPlan[day] = [...newPlan[day], plannedWorkout];
    }

    setTrainingPlan(newPlan);
    setWorkoutForm({
      type: 'Run',
      amount: '',
      unit: '',
      duration: '',
      notes: '',
      intervals: [],
      exercises: [],
    });
    setIntervalsExpanded(false);
    setEditingDay(null);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingDay(null);
    setEditingIndex(null);
    setWorkoutForm({
      type: 'Run',
      amount: '',
      unit: '',
      duration: '',
      notes: '',
      intervals: [],
      exercises: [],
    });
    setIntervalsExpanded(false);
  };

  const handleAddCustomType = async (newType: string) => {
    if (!group || !groupId) return;

    const currentTypes = group.workoutTypes || [];
    if (!currentTypes.includes(newType)) {
      const updatedTypes = [...currentTypes, newType];
      const { error } = await handleAsync(async () => {
        const res = await fetch('/api/groups', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workoutTypes: updatedTypes }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to update group');
        }
      }, 'updateGroup');
      if (!error) {
        setGroup({ ...group, workoutTypes: updatedTypes });
        setWorkoutForm((prev) => ({ ...prev, type: newType }));
      }
    } else {
      setWorkoutForm((prev) => ({ ...prev, type: newType }));
    }
  };

  const handleDeleteWorkout = (day: string, index: number) => {
    const newPlan = { ...trainingPlan };
    if (newPlan[day]) {
      newPlan[day] = newPlan[day].filter((_, i) => i !== index);
      if (newPlan[day].length === 0) {
        delete newPlan[day];
      }
      setTrainingPlan(newPlan);
    }
  };

  // Interval handlers
  const handleAddInterval = () => {
    setWorkoutForm((prev) => ({
      ...prev,
      intervals: [...prev.intervals, { type: 'warmup' as const }],
    }));
    setIntervalsExpanded(true);
  };

  const handleRemoveInterval = (index: number) => {
    setWorkoutForm((prev) => ({
      ...prev,
      intervals: prev.intervals.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateInterval = (
    index: number,
    field: keyof Interval,
    value: string | number | undefined
  ) => {
    setWorkoutForm((prev) => ({
      ...prev,
      intervals: prev.intervals.map((interval, i) =>
        i === index ? { ...interval, [field]: value } : interval
      ),
    }));
  };

  // Exercise handlers
  const handleAddExercise = () => {
    setWorkoutForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: [] }],
    }));
  };

  const handleRemoveExercise = (index: number) => {
    setWorkoutForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateExerciseName = (index: number, name: string) => {
    setWorkoutForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === index ? { ...exercise, name } : exercise
      ),
    }));
  };

  const handleAddSet = (exerciseIndex: number) => {
    setWorkoutForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === exerciseIndex
          ? { ...exercise, sets: [...exercise.sets, {}] }
          : exercise
      ),
    }));
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setWorkoutForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === exerciseIndex
          ? { ...exercise, sets: exercise.sets.filter((_, si) => si !== setIndex) }
          : exercise
      ),
    }));
  };

  const handleUpdateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: string
  ) => {
    setWorkoutForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, si) =>
                si === setIndex
                  ? {
                      ...set,
                      [field]: value === '' ? undefined : field === 'reps' ? parseInt(value, 10) : parseFloat(value),
                    }
                  : set
              ),
            }
          : exercise
      ),
    }));
  };

  const handleDone = async () => {
    if (!group || !group._id) return;

    const { error } = await handleAsync(async () => {
      const res = await fetch('/api/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group._id?.toString() || group._id,
          trainingPlan,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update group');
      }
    }, 'handleDone');

    if (error) {
      toast.error(getErrorMessage(error));
      return;
    }

    toast.success('Training plan saved!');
    setShowInviteModal(true);
  };

  const handleGoToDashboard = () => {
    if (!group || !group._id) return;
    const groupIdStr = group._id?.toString() || group._id;
    router.push(`/dashboard/${groupIdStr}`);
  };

  const handleCopyLink = () => {
    if (!group) return;
    const inviteUrl = `${window.location.origin}/join/${group.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied!');
  };

  if (loading || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentGroupId={groupId} />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            Set Up Your Weekly Training Plan
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            Add workouts for each day of the week. This plan will repeat weekly.
          </p>

          {/* Calendar Grid - Responsive: 2 cols mobile, 4 cols tablet, 7 cols desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mb-8">
            {DAYS.map((day) => {
              const workouts = trainingPlan[day] || [];

              return (
                <div
                  key={day}
                  className="border-2 border-gray-200 rounded-xl p-2 sm:p-3 min-h-[180px] sm:min-h-[200px] flex flex-col bg-white hover:border-primary/30 transition-colors"
                >
                  {/* Day Header */}
                  <div className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-center text-gray-900">
                    {day}
                  </div>

                  {/* Workouts List */}
                  <div className="flex-1 space-y-1 sm:space-y-1.5 mb-2 min-h-0 overflow-y-auto max-h-[100px] sm:max-h-[120px]">
                    {workouts.length > 0 ? (
                      workouts.map((workout, index) => {
                        let workoutText = '';
                        if (typeof workout === 'string') {
                          workoutText = workout;
                        } else {
                          workoutText = workout.type;
                          if (workout.amount) {
                            workoutText += ` ${workout.amount}${workout.unit || 'km'}`;
                          }
                          if (workout.duration) {
                            workoutText += ` (${workout.duration}min)`;
                          }
                          if (workout.intervals && workout.intervals.length > 0) {
                            workoutText += ` • ${workout.intervals.length} interval${workout.intervals.length > 1 ? 's' : ''}`;
                          }
                          if (workout.exercises && workout.exercises.length > 0) {
                            workoutText += ` • ${workout.exercises.length} exercise${workout.exercises.length > 1 ? 's' : ''}`;
                          }
                        }
                        return (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs border border-primary/20 w-full"
                          >
                            <button
                              type="button"
                              className="flex-1 truncate cursor-pointer text-left"
                              onClick={() => handleEditWorkout(day, index)}
                              title="Click to edit"
                            >
                              {workoutText}
                            </button>
                            <button
                              onClick={() => handleDeleteWorkout(day, index)}
                              className="text-primary hover:text-primary-dark flex-shrink-0"
                              type="button"
                              aria-label={`Delete ${workoutText}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[10px] sm:text-xs text-gray-400 text-center py-1 sm:py-2">
                        No workouts
                      </div>
                    )}
                  </div>

                  {/* Add Workout Button */}
                  <button
                    onClick={() => handleAddWorkout(day)}
                    className="w-full px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-0.5 sm:gap-1 border border-dashed border-gray-300 hover:border-primary"
                    type="button"
                  >
                    <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              onClick={() => router.push(`/dashboard/${groupId}`)}
              className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-semibold text-sm sm:text-base"
              type="button"
            >
              Skip for Now
            </button>
            <button
              onClick={handleDone}
              className="w-full sm:w-auto btn-primary px-6 py-3 text-base sm:text-lg"
              type="button"
            >
              Done →
            </button>
          </div>
        </div>
      </div>

      {/* Workout Edit Modal */}
      {editingDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingIndex !== null ? 'Edit Workout' : 'Add Workout'} - {editingDay}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Workout Type Selector */}
              <div>
                <label htmlFor="workout-type" className="block text-sm font-semibold text-black mb-3">
                  Workout Type
                </label>
                <select
                  id="workout-type"
                  value={workoutForm.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    if (newType === '__custom__') {
                      // Handle custom type input (similar to BasicWorkoutFields)
                      const customType = prompt('Enter custom workout type (max 30 characters):');
                      if (customType && customType.trim() && customType.length <= 30) {
                        handleAddCustomType(customType.trim());
                      }
                      return;
                    }
                    // Clear intervals/exercises when switching types
                    setWorkoutForm((prev) => ({
                      ...prev,
                      type: newType,
                      intervals: newType === 'Run' || newType === 'Bike' || newType === 'Swim' ? prev.intervals : [],
                      exercises: newType === 'Strength' ? prev.exercises : [],
                    }));
                  }}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
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
              {workoutForm.type !== 'Strength' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="workout-amount" className="block text-sm font-semibold text-black mb-3">
                      Amount
                    </label>
                    <input
                      id="workout-amount"
                      type="number"
                      step="0.01"
                      value={workoutForm.amount || ''}
                      onChange={(e) => setWorkoutForm((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="e.g., 5"
                      className="w-full px-6 py-4 h-[56px] border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="workout-unit" className="block text-sm font-semibold text-black mb-3">
                      Unit
                    </label>
                    <select
                      id="workout-unit"
                      value={workoutForm.unit || ''}
                      onChange={(e) => setWorkoutForm((prev) => ({ ...prev, unit: e.target.value }))}
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

              {/* Intervals Section for Run/Bike/Swim */}
              {(workoutForm.type === 'Run' ||
                workoutForm.type === 'Bike' ||
                workoutForm.type === 'Swim') && (
                <IntervalsSection
                  type={workoutForm.type as 'Run' | 'Bike' | 'Swim'}
                  intervals={workoutForm.intervals}
                  expanded={intervalsExpanded}
                  onToggle={() => setIntervalsExpanded(!intervalsExpanded)}
                  onAdd={handleAddInterval}
                  onRemove={handleRemoveInterval}
                  onUpdate={handleUpdateInterval}
                />
              )}

              {/* Strength Training Section */}
              {workoutForm.type === 'Strength' && (
                <StrengthTrainingSection
                  exercises={workoutForm.exercises}
                  errors={{}}
                  onAddExercise={handleAddExercise}
                  onRemoveExercise={handleRemoveExercise}
                  onUpdateExerciseName={handleUpdateExerciseName}
                  onAddSet={handleAddSet}
                  onRemoveSet={handleRemoveSet}
                  onUpdateSet={handleUpdateSet}
                />
              )}

              {/* Duration - Available for all types */}
              <div>
                <label htmlFor="workout-duration" className="block text-sm font-semibold text-black mb-3">
                  Duration (minutes)
                </label>
                <input
                  id="workout-duration"
                  type="number"
                  step="1"
                  value={workoutForm.duration || ''}
                  onChange={(e) => setWorkoutForm((prev) => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 30"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
                />
              </div>

              {/* Notes - Available for all types */}
              <div>
                <label
                  htmlFor="workout-notes"
                  className="block text-sm font-semibold text-black mb-3"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="workout-notes"
                  value={workoutForm.notes}
                  onChange={(e) => setWorkoutForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g., Easy pace, Upper body focus"
                  rows={3}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-semibold"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWorkout}
                  className="flex-1 btn-primary px-6 py-3"
                  type="button"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">✓ Group Created!</h2>
            <p className="text-sm sm:text-base text-gray-700 mb-4">
              Invite your crew with this link:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <input
                type="text"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${group.inviteCode}`}
                readOnly
                className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors whitespace-nowrap text-sm sm:text-base"
              >
                Copy Link
              </button>
            </div>
            <button
              onClick={handleGoToDashboard}
              className="btn-primary w-full text-base sm:text-lg"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
