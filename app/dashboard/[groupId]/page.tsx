'use client';

import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import CountdownCard from '@/components/dashboard/CountdownCard';
import EditableEmoji from '@/components/dashboard/EditableEmoji';
import InviteSection from '@/components/dashboard/InviteSection';
import ProgressChart from '@/components/dashboard/ProgressChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import StatisticsCard from '@/components/dashboard/StatisticsCard';
import WeeklyPlanCard from '@/components/dashboard/WeeklyPlanCard';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import LogWorkoutModal from '@/components/LogWorkoutModal';
import Navbar from '@/components/Navbar';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Workout } from '@/lib/db';
import { isValidRouteParam } from '@/lib/validation';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const groupIdParam = params.groupId;
  const groupId = isValidRouteParam(groupIdParam) ? groupIdParam : null;
  const { user, isLoaded: userLoaded } = useUser();

  const [showLogModal, setShowLogModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const {
    group,
    members,
    workouts,
    loading,
    handleSaveWorkout: saveWorkout,
    handleDeleteWorkout,
    handleUpdateGroup,
  } = useDashboardData(groupId || '');

  if (!groupId || !userLoaded) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    router.push('/');
    return null;
  }

  const handleLogWorkout = () => {
    setEditingWorkout(null);
    setShowLogModal(true);
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setShowLogModal(true);
  };

  const handleSaveWorkout = async (workoutData: Omit<Workout, '_id' | 'createdAt'>) => {
    await saveWorkout(workoutData, editingWorkout);
    setShowLogModal(false);
    setEditingWorkout(null);
  };

  if (loading || !group) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentGroupId={groupId} />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <EditableEmoji
                emoji={group.emoji || '🏃'}
                onChange={(emoji) => handleUpdateGroup({ emoji })}
                size="lg"
              />
              <h1 className="heading-lg text-black tracking-tight">{group.name}</h1>
            </div>
            <button
              onClick={handleLogWorkout}
              type="button"
              className="btn-primary text-base hidden md:block"
            >
              + Log Workout
            </button>
          </div>

          <CountdownCard group={group} onUpdateGroup={handleUpdateGroup} />

          {/* Log Workout button for mobile - shown below countdown */}
          <button
            onClick={handleLogWorkout}
            type="button"
            className="btn-primary text-base w-full mt-4 md:hidden"
          >
            + Log Workout
          </button>
        </div>

        {/* Weekly Plan - Full width */}
        <div className="mb-6">
          <WeeklyPlanCard
            group={group}
            workouts={workouts}
            members={members}
            onUpdateGroup={handleUpdateGroup}
          />
        </div>

        {/* Progress Chart and Recent Activity - Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Plan Progress Chart - 50% width */}
          <div>
            <ProgressChart group={group} members={members} workouts={workouts} />
          </div>
          {/* Recent Activity - 50% width */}
          <div>
            <RecentActivity
              members={members}
              workouts={workouts}
              onEditWorkout={handleEditWorkout}
              onDeleteWorkout={handleDeleteWorkout}
            />
          </div>
        </div>

        {/* Group Statistics */}
        <div className="mb-6">
          <StatisticsCard workouts={workouts} />
        </div>

        <InviteSection group={group} />
      </div>

      {showLogModal && (
        <LogWorkoutModal
          groupId={groupId}
          group={group}
          members={members}
          workout={editingWorkout}
          onSave={handleSaveWorkout}
          onClose={() => {
            setShowLogModal(false);
            setEditingWorkout(null);
          }}
          onUpdateGroup={handleUpdateGroup}
        />
      )}
    </div>
  );
}
