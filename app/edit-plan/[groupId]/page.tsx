'use client';

import { Plus, RotateCcw, X } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import WeekNavigator from '@/components/dashboard/WeekNavigator';
import Navbar from '@/components/Navbar';
import { useToast } from '@/components/Toast';
import WorkoutFields from '@/components/workout-form/WorkoutFields';
import { DAYS } from '@/lib/constants';
import {
  formatWorkoutForCalendar,
  getWeekKey,
  getWeekPlan,
  getWeekRange,
} from '@/lib/dashboard-utils';
import type { Exercise, Group, Interval, PlannedWorkout, WeeklyPlan } from '@/lib/db';
import { getErrorMessage, handleAsync } from '@/lib/error-handler';

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const toast = useToast();
  const groupId = params.groupId as string;
  const weekParam = searchParams.get('week');

  const [group, setGroup] = useState<Group | null>(null);
  const [currentWeekKey, setCurrentWeekKey] = useState(weekParam || getWeekKey());
  const [useDefaultPlan, setUseDefaultPlan] = useState(true);
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
    avgPace: string;
  }>({
    type: 'Run',
    amount: '',
    unit: '',
    duration: '',
    notes: '',
    intervals: [],
    exercises: [],
    avgPace: '',
  });
  const [intervalsExpanded, setIntervalsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    loadedGroupIdRef.current = groupId;
    setLoading(false);
  }, [groupId, router, toast]);

  useEffect(() => {
    if (groupId && loadedGroupIdRef.current !== groupId) {
      loadGroup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, loadGroup]);

  useEffect(() => {
    if (group) {
      // Check if this week has an override
      const hasOverride = !!group.weeklyPlanOverrides?.[currentWeekKey];
      setUseDefaultPlan(!hasOverride);

      // Load the appropriate plan
      const plan = getWeekPlan(group, currentWeekKey);
      setTrainingPlan(plan);
    }
  }, [group, currentWeekKey]);

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
      avgPace: '',
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
        avgPace: '',
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
        avgPace: workout.avgPace?.toString() || '',
      });
    }
    setEditingDay(day);
    setEditingIndex(index);
    setIntervalsExpanded(((workout as PlannedWorkout)?.intervals?.length || 0) > 0);
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
      avgPace: workoutForm.avgPace ? parseFloat(workoutForm.avgPace) : undefined,
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
      avgPace: '',
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
      avgPace: '',
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
          body: JSON.stringify({ groupId, workoutTypes: updatedTypes }),
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
      intervals: [...prev.intervals, { type: 'warmup' as const, repeats: undefined }],
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
        i === exerciseIndex ? { ...exercise, sets: [...exercise.sets, {}] } : exercise
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
      ),
    }));
  };

  const handleTogglePlanType = () => {
    if (!group) return;

    const newUseDefault = !useDefaultPlan;
    setUseDefaultPlan(newUseDefault);

    if (newUseDefault) {
      // Switch to default plan
      setTrainingPlan(group.trainingPlan);
    } else {
      // Switch to week-specific plan (create from default if no override exists)
      const override = group.weeklyPlanOverrides?.[currentWeekKey];
      setTrainingPlan(override || group.trainingPlan);
    }
  };

  const handleResetToDefault = async () => {
    if (!group) return;

    // Remove override for this week
    const newOverrides = { ...group.weeklyPlanOverrides };
    delete newOverrides[currentWeekKey];

    const { error } = await handleAsync(async () => {
      const res = await fetch('/api/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          weeklyPlanOverrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update group');
      }
    }, 'resetToDefault');

    if (error) {
      toast.error(getErrorMessage(error));
      return;
    }

    const updatedGroup: Group = {
      ...group,
      weeklyPlanOverrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
    };
    setGroup(updatedGroup);
    setUseDefaultPlan(true);
    setTrainingPlan(group.trainingPlan);
  };

  const handleSave = async () => {
    if (!group) return;

    setSaving(true);
    const { error } = await handleAsync(async () => {
      if (useDefaultPlan) {
        // Update default plan
        const res = await fetch('/api/groups', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId, trainingPlan }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to update group');
        }
      } else {
        // Update week-specific override
        const newOverrides = {
          ...(group.weeklyPlanOverrides || {}),
          [currentWeekKey]: trainingPlan,
        };
        const res = await fetch('/api/groups', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId, weeklyPlanOverrides: newOverrides }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to update group');
        }
      }
    }, 'handleSave');

    if (error) {
      toast.error(getErrorMessage(error));
      setSaving(false);
      return;
    }

    toast.success('Training plan saved!');
    router.push(`/dashboard/${groupId}`);
  };

  if (loading || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const { start } = getWeekRange(currentWeekKey);
  const isUsingOverride = !!group.weeklyPlanOverrides?.[currentWeekKey];

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentGroupId={groupId} />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            Edit Training Plan
          </h1>

          <WeekNavigator
            currentWeekKey={currentWeekKey}
            onWeekChange={setCurrentWeekKey}
            onToday={() => setCurrentWeekKey(getWeekKey())}
          />

          {/* Plan Type Toggle */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-semibold text-gray-700">
                  {useDefaultPlan ? 'Editing Default Plan' : 'Editing Week-Specific Plan'}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {useDefaultPlan
                    ? 'Changes will apply to all weeks using the default plan'
                    : `Custom plan for week of ${start.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleTogglePlanType}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useDefaultPlan ? 'bg-gray-300' : 'bg-primary'
                }`}
                aria-label="Toggle plan type"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useDefaultPlan ? 'translate-x-1' : 'translate-x-6'
                  }`}
                />
              </button>
            </div>

            {!useDefaultPlan && isUsingOverride && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to default plan
              </button>
            )}
          </div>

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
                        const workoutText = formatWorkoutForCalendar(workout);
                        const workoutKey =
                          typeof workout === 'string'
                            ? `${day}-${index}-${workout}`
                            : `${day}-${index}-${workout.type}-${workout.notes || ''}`;
                        return (
                          <div
                            key={workoutKey}
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
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto btn-primary px-6 py-3 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {saving ? 'Saving...' : 'Save Plan'}
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
              <WorkoutFields
                group={group}
                type={workoutForm.type}
                amount={workoutForm.amount}
                unit={workoutForm.unit}
                duration={workoutForm.duration}
                notes={workoutForm.notes}
                intervals={workoutForm.intervals}
                exercises={workoutForm.exercises}
                avgPace={workoutForm.avgPace}
                onTypeChange={(type) => {
                  setWorkoutForm((prev) => ({
                    ...prev,
                    type,
                    intervals:
                      type === 'Run' || type === 'Bike' || type === 'Swim' ? prev.intervals : [],
                    exercises: type === 'Strength' ? prev.exercises : [],
                  }));
                }}
                onAmountChange={(amount) => setWorkoutForm((prev) => ({ ...prev, amount }))}
                onUnitChange={(unit) => setWorkoutForm((prev) => ({ ...prev, unit }))}
                onDurationChange={(duration) => setWorkoutForm((prev) => ({ ...prev, duration }))}
                onNotesChange={(notes) => setWorkoutForm((prev) => ({ ...prev, notes }))}
                onIntervalsChange={(intervals) =>
                  setWorkoutForm((prev) => ({ ...prev, intervals }))
                }
                onExercisesChange={(exercises) =>
                  setWorkoutForm((prev) => ({ ...prev, exercises }))
                }
                onAvgPaceChange={(avgPace) => setWorkoutForm((prev) => ({ ...prev, avgPace }))}
                showCustomType={true}
                onCustomTypeAdd={handleAddCustomType}
                errors={{}}
                showDuration={true}
                intervalsExpanded={intervalsExpanded}
                onToggleIntervals={() => setIntervalsExpanded(!intervalsExpanded)}
                onAddInterval={handleAddInterval}
                onRemoveInterval={handleRemoveInterval}
                onUpdateInterval={handleUpdateInterval}
                onAddExercise={handleAddExercise}
                onRemoveExercise={handleRemoveExercise}
                onUpdateExerciseName={handleUpdateExerciseName}
                onAddSet={handleAddSet}
                onRemoveSet={handleRemoveSet}
                onUpdateSet={handleUpdateSet}
              />

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
    </div>
  );
}
