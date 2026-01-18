'use client';

import { ArrowLeft, Plus, RotateCcw } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import WeekNavigator from '@/components/dashboard/WeekNavigator';
import Navbar from '@/components/Navbar';
import PlannedWorkoutEditor from '@/components/workout-form/PlannedWorkoutEditor';
import { DAYS, getWeekKey, getWeekPlan, getWeekRange } from '@/lib/dashboard-utils';
import type { Group, PlannedWorkout, WeeklyPlan } from '@/lib/db';

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = params.groupId as string;
  const weekParam = searchParams.get('week');

  const [group, setGroup] = useState<Group | null>(null);
  const [currentWeekKey, setCurrentWeekKey] = useState(weekParam || getWeekKey());
  const [useDefaultPlan, setUseDefaultPlan] = useState(true);
  const [trainingPlan, setTrainingPlan] = useState<WeeklyPlan>({});
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      if (!data.group) {
        router.push('/');
        return;
      }
      setGroup(data.group);
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, router]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

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
  };

  const handleSaveWorkout = (day: string, workout: string | PlannedWorkout) => {
    const newPlan = { ...trainingPlan };
    if (!newPlan[day]) {
      newPlan[day] = [];
    }
    newPlan[day] = [...newPlan[day], workout];
    setTrainingPlan(newPlan);
    setEditingDay(null);
  };

  const handleUpdateWorkout = (day: string, index: number, workout: string | PlannedWorkout) => {
    const newPlan = { ...trainingPlan };
    if (newPlan[day]) {
      newPlan[day] = [...newPlan[day]];
      newPlan[day][index] = workout;
      setTrainingPlan(newPlan);
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

  const handleUpdateGroup = async (updates: Partial<Group>) => {
    if (!group) return;
    const res = await fetch('/api/groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, ...updates }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update group');
    }
    const updatedGroup: Group = {
      ...group,
      ...updates,
    };
    setGroup(updatedGroup);
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

  const handleResetToDefault = () => {
    if (!group) return;

    // Remove override for this week
    const newOverrides = { ...group.weeklyPlanOverrides };
    delete newOverrides[currentWeekKey];

    const updatedGroup: Group = {
      ...group,
      weeklyPlanOverrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
    };

    fetch('/api/groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        weeklyPlanOverrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to update group');
      })
      .then(() => {
        setGroup(updatedGroup);
        setUseDefaultPlan(true);
        setTrainingPlan(group.trainingPlan);
      })
      .catch((error) => {
        console.error('Error updating group:', error);
      });
  };

  const handleSave = async () => {
    if (!group) return;

    setSaving(true);
    try {
      if (useDefaultPlan) {
        // Update default plan
        const res = await fetch('/api/groups', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId, trainingPlan }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
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
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update group');
        }
      }
      router.push(`/dashboard/${groupId}`);
    } catch (error) {
      console.error('Error saving plan:', error);
      alert(error instanceof Error ? error.message : 'Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${groupId}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="heading-lg text-gray-900 mb-4">Edit Training Plan</h1>

            <WeekNavigator currentWeekKey={currentWeekKey} onWeekChange={setCurrentWeekKey} />

            {/* Plan Type Toggle */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
          </div>

          {/* Plan Editor */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-3">
            {DAYS.map((day) => {
              const dayWorkouts = trainingPlan[day] || [];
              const isEditing = editingDay === day;

              return (
                <div key={day} className="border border-gray-200 rounded-lg p-3 md:p-4 bg-gray-50">
                  <div className="mb-3">
                    <h3 className="heading-sm text-gray-900 font-bold">{day}</h3>
                  </div>

                  {isEditing && (
                    <div className="mb-3">
                      <PlannedWorkoutEditor
                        group={group}
                        workout=""
                        onUpdate={(workout) => {
                          handleSaveWorkout(day, workout);
                          setEditingDay(null);
                        }}
                        onDelete={() => setEditingDay(null)}
                        onUpdateGroup={handleUpdateGroup}
                      />
                    </div>
                  )}

                  {dayWorkouts.length > 0 ? (
                    <div className="space-y-2">
                      {dayWorkouts.map((workout, index) => {
                        const workoutKey =
                          typeof workout === 'string'
                            ? `${day}-${index}-${workout}`
                            : `${day}-${index}-${workout.type}-${workout.description || ''}`;
                        return (
                          <PlannedWorkoutEditor
                            key={workoutKey}
                            group={group}
                            workout={workout}
                            onUpdate={(updated) => handleUpdateWorkout(day, index, updated)}
                            onDelete={() => handleDeleteWorkout(day, index)}
                            onUpdateGroup={handleUpdateGroup}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    !isEditing && (
                      <div className="text-xs text-gray-400 italic text-center md:text-left mb-2">
                        No workouts
                      </div>
                    )
                  )}

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => handleAddWorkout(day)}
                      className="w-full mt-2 py-1 text-xs font-medium text-primary border border-primary rounded hover:bg-primary hover:text-white transition-colors"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${groupId}`)}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
