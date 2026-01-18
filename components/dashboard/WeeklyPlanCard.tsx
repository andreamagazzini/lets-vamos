'use client';

import { useUser } from '@clerk/nextjs';
import { Edit, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DAYS, getWeekKey, getWeekPlan, getWeekRange, isToday } from '@/lib/dashboard-utils';
import type { Group, GroupPlanSettings, Member, PlannedWorkout, Workout } from '@/lib/db';
import { getMemberDisplayName } from '@/lib/utils';
import PlannedWorkoutItem from './PlannedWorkoutItem';
import PlanSettingsModal from './PlanSettingsModal';
import WeekNavigator from './WeekNavigator';

interface WeeklyPlanCardProps {
  group: Group;
  workouts: Workout[];
  members: Member[];
  onUpdateGroup: (updates: Partial<Group>) => void;
}

const DEFAULT_SETTINGS: GroupPlanSettings = {
  displayStyle: 'expanded',
  showIcons: true,
  showDetails: true,
  colorTheme: 'default',
  highlightToday: true,
};

export default function WeeklyPlanCard({
  group,
  workouts,
  members,
  onUpdateGroup,
}: WeeklyPlanCardProps) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [currentWeekKey, setCurrentWeekKey] = useState(getWeekKey());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPlannedWorkout, setSelectedPlannedWorkout] = useState<
    PlannedWorkout | string | null
  >(null);
  const settings = group.planSettings || DEFAULT_SETTINGS;

  const weekPlanData = getWeekPlan(group, currentWeekKey);
  const weekPlan: Record<string, (string | PlannedWorkout)[]> = {};
  DAYS.forEach((day) => {
    weekPlan[day] = weekPlanData[day] || [];
  });

  const isUsingOverride = !!group.weeklyPlanOverrides?.[currentWeekKey];
  const isCurrentWeek = currentWeekKey === getWeekKey();

  // Get workouts for the current week
  const { start: monday } = getWeekRange(currentWeekKey);
  const getWorkoutsForDay = (dayIndex: number) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIndex);
    // Use local date string to avoid timezone issues (matching getWeeklyPlanProgress)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    return workouts.filter((w) => {
      // Match the logic from getWeeklyPlanProgress
      // If date is already a YYYY-MM-DD string, use it directly
      if (typeof w.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w.date)) {
        return w.date === dateKey;
      }

      // Otherwise, parse as Date and convert to local date string
      const workoutDate = new Date(w.date);
      const workoutDateStr = `${workoutDate.getFullYear()}-${String(workoutDate.getMonth() + 1).padStart(2, '0')}-${String(workoutDate.getDate()).padStart(2, '0')}`;
      return workoutDateStr === dateKey;
    });
  };

  // Group workouts by type for a day
  const groupWorkoutsByType = (dayWorkouts: Workout[]) => {
    const grouped: Record<
      string,
      {
        workouts: Workout[];
        amounts: Array<{ member: Member; amount: number; unit: string }>;
        allWorkouts: Array<{ member: Member | null; workout: Workout }>;
      }
    > = {};
    dayWorkouts.forEach((workout) => {
      if (!grouped[workout.type]) {
        grouped[workout.type] = { workouts: [], amounts: [], allWorkouts: [] };
      }
      grouped[workout.type].workouts.push(workout);

      const member = members.find((m) => m.userId === workout.userId);

      // Always add to allWorkouts, even if member not found
      grouped[workout.type].allWorkouts.push({ member: member || null, workout });

      // Add to amounts only if member found and workout has amount/distance
      if (member) {
        const amount = workout.amount || workout.distance;
        if (amount !== undefined && amount !== null) {
          const unit = workout.unit || (workout.type === 'Swim' ? 'm' : 'km');
          grouped[workout.type].amounts.push({ member, amount, unit });
        }
      }
    });
    return grouped;
  };

  const handleSaveSettings = (newSettings: GroupPlanSettings) => {
    onUpdateGroup({ planSettings: newSettings });
  };

  const handleEditPlan = () => {
    const groupId = group._id?.toString() || group._id;
    router.push(`/edit-plan/${groupId}?week=${currentWeekKey}`);
  };

  const handleToday = () => {
    setCurrentWeekKey(getWeekKey());
  };

  const shouldHighlightToday = settings.highlightToday && isCurrentWeek;

  // Get current user's member record
  const { user } = useUser();
  const _currentMember = user?.id ? members.find((m) => m.userId === user.id) : null;

  // Check if current user has done a specific workout type on a day
  const hasUserDoneWorkoutType = (dayIndex: number, type: string) => {
    if (!user?.id) return false;
    const dayWorkouts = getWorkoutsForDay(dayIndex);
    return dayWorkouts.some((w) => w.userId === user.id && w.type === type);
  };

  // Check if current user has completed a planned workout
  const hasUserCompletedPlannedWorkout = (
    dayIndex: number,
    plannedWorkout: string | PlannedWorkout
  ) => {
    if (!user?.id) return false;
    const plannedType = typeof plannedWorkout === 'string' ? 'Other' : plannedWorkout.type;
    if (plannedType === 'Rest') return false;

    const dayWorkouts = getWorkoutsForDay(dayIndex);
    const userWorkouts = dayWorkouts.filter((w) => w.userId === user.id && w.type === plannedType);

    if (userWorkouts.length === 0) return false;

    // If planned workout has amount, check if user logged matching amount
    if (typeof plannedWorkout === 'object' && plannedWorkout.amount !== undefined) {
      return userWorkouts.some((w) => {
        const loggedAmount = w.amount || w.distance;
        const loggedUnit = w.unit || (w.type === 'Swim' ? 'm' : 'km');
        if (loggedAmount === undefined) return false;
        if (plannedWorkout.unit && loggedUnit !== plannedWorkout.unit) return false;
        return (
          plannedWorkout.amount !== undefined &&
          Math.abs(loggedAmount - plannedWorkout.amount) < 0.01
        );
      });
    }

    // If no amount specified, any workout of that type counts
    return true;
  };

  return (
    <>
      <div className="card-modern">
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-md text-black tracking-tight">Weekly Plan</h2>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Edit plan settings"
          >
            <Pencil className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <WeekNavigator
          currentWeekKey={currentWeekKey}
          onWeekChange={setCurrentWeekKey}
          onToday={handleToday}
        />

        {isUsingOverride && (
          <div className="mb-4 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-xs font-medium text-primary">Custom plan for this week</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3">
          {DAYS.map((day, index) => {
            const plannedWorkouts = weekPlan[day] || [];
            const loggedWorkouts = getWorkoutsForDay(index);
            const workoutsByType = groupWorkoutsByType(loggedWorkouts);
            const isTodayDay = shouldHighlightToday && isToday(index);

            // Merge planned and logged workouts by type
            // Create a map of all workout types for this day
            const allWorkoutTypes = new Set<string>();
            plannedWorkouts.forEach((w) => {
              const type = typeof w === 'string' ? 'Other' : w.type;
              if (type !== 'Rest') {
                allWorkoutTypes.add(type);
              }
            });
            Object.keys(workoutsByType).forEach((type) => {
              allWorkoutTypes.add(type);
            });

            // Create merged workout items
            const mergedWorkouts = Array.from(allWorkoutTypes).map((type) => {
              // Find planned workout of this type
              const planned =
                plannedWorkouts.find((w) => typeof w !== 'string' && w.type === type) ||
                (plannedWorkouts.find((w) => typeof w === 'string') && type === 'Other'
                  ? 'Other'
                  : null);

              // Get logged workouts of this type
              const logged = workoutsByType[type] || null;

              // Check if user has completed this type
              const userHasDone = hasUserDoneWorkoutType(index, type);
              const isCompleted = planned
                ? hasUserCompletedPlannedWorkout(index, planned)
                : userHasDone;

              return {
                type,
                planned: planned || null,
                logged,
                userHasDone,
                isCompleted,
              };
            });

            // Add Rest days separately (they don't merge with logged workouts)
            const restDays = plannedWorkouts.filter(
              (w) => typeof w === 'object' && w.type === 'Rest'
            );

            return (
              <div
                key={day}
                className={`p-3 md:p-4 rounded-xl transition-all bg-gray-50 border-2 ${
                  isTodayDay ? 'border-primary' : 'border-gray-100 hover:border-primary/20'
                }`}
              >
                <div className="font-bold text-xs md:text-sm mb-2 tracking-wide text-center md:text-left">
                  {day}
                </div>
                {mergedWorkouts.length > 0 || restDays.length > 0 ? (
                  <div className="space-y-2">
                    {/* All workouts - full width */}
                    {mergedWorkouts.length > 0 && (
                      <div className="space-y-1.5">
                        {mergedWorkouts.map((item) => {
                          const workoutKey = `merged-${day}-${item.type}`;
                          const workoutToDisplay = item.planned || { type: item.type };
                          const isCompleted = item.isCompleted || item.userHasDone;
                          return (
                            <button
                              key={workoutKey}
                              type="button"
                              onClick={() => {
                                setSelectedDay(day);
                                setSelectedType(item.type);
                                setSelectedPlannedWorkout(item.planned);
                              }}
                              className="w-full focus:outline-none"
                            >
                              <PlannedWorkoutItem
                                workout={workoutToDisplay}
                                settings={settings}
                                isToday={isTodayDay}
                                isCompleted={isCompleted}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Rest days (shown separately) */}
                    {restDays.length > 0 && (
                      <div className="space-y-1.5">
                        {restDays.map((restDay, i) => {
                          const workoutKey = `rest-${day}-${i}`;
                          return (
                            <button
                              key={workoutKey}
                              type="button"
                              onClick={() => {
                                setSelectedDay(day);
                                setSelectedType('Rest');
                                setSelectedPlannedWorkout(restDay);
                              }}
                              className="w-full focus:outline-none"
                            >
                              <PlannedWorkoutItem
                                workout={restDay}
                                settings={settings}
                                isToday={isTodayDay}
                                isCompleted={false}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="body-sm text-gray-400 text-center md:text-left text-xs md:text-sm">
                    No workouts planned
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleEditPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            aria-label="Edit plan"
          >
            <Edit className="w-4 h-4" />
            Edit Plan
          </button>
        </div>
      </div>

      <PlanSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        currentSettings={settings}
      />

      {/* Workout Details Modal */}
      {selectedDay && selectedType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedType} - {selectedDay}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(null);
                  setSelectedType(null);
                  setSelectedPlannedWorkout(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {(() => {
              const dayIndex = DAYS.indexOf(selectedDay as any);
              const dayWorkouts = getWorkoutsForDay(dayIndex);
              const typeWorkouts = dayWorkouts.filter((w) => w.type === selectedType);
              const workoutsByType = groupWorkoutsByType(typeWorkouts);
              const typeData = workoutsByType[selectedType!];

              // Show planned goal if available
              const plannedGoal =
                selectedPlannedWorkout && typeof selectedPlannedWorkout !== 'string'
                  ? selectedPlannedWorkout
                  : null;

              return (
                <div className="space-y-4">
                  {/* Planned Goal */}
                  {plannedGoal && plannedGoal.type !== 'Rest' && (
                    <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                      <div className="text-sm font-semibold text-primary mb-1">Planned Goal</div>
                      <div className="text-base text-gray-900">
                        {plannedGoal.amount !== undefined ? (
                          <>
                            {plannedGoal.amount} {plannedGoal.unit || 'km'}
                          </>
                        ) : (
                          <span className="text-gray-600">No specific amount</span>
                        )}
                      </div>
                      {plannedGoal.duration && (
                        <div className="text-sm text-gray-600 mt-1">
                          Duration: {plannedGoal.duration} min
                        </div>
                      )}
                      {plannedGoal.notes && (
                        <div className="text-sm text-gray-600 mt-1">{plannedGoal.notes}</div>
                      )}
                    </div>
                  )}

                  {/* Logged Workouts */}
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Logged Workouts</div>
                    {typeData && typeData.allWorkouts.length > 0 ? (
                      <div className="space-y-2">
                        {typeData.allWorkouts.map((item, idx) => {
                          const workout = item.workout;
                          const amount = workout.amount || workout.distance;
                          const unit = workout.unit || (workout.type === 'Swim' ? 'm' : 'km');
                          const member = item.member;
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <span className="font-medium text-gray-900">
                                {member ? getMemberDisplayName(member) : 'Unknown User'}
                                {member && member.userId === user?.id && (
                                  <span className="ml-2 text-xs text-primary font-medium">
                                    (You)
                                  </span>
                                )}
                              </span>
                              <span className="text-sm text-gray-600">
                                {amount !== undefined && amount !== null ? (
                                  <>
                                    {amount} {unit}
                                  </>
                                ) : workout.duration ? (
                                  `${workout.duration} min`
                                ) : (
                                  'Logged'
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No workouts logged for this type</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
