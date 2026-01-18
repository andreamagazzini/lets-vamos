'use client';

import { Activity, Calendar, Clock, Flame, Footprints, Target, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { getGroupStatistics } from '@/lib/dashboard-utils';
import type { Workout } from '@/lib/db';

interface StatisticsCardProps {
  workouts: Workout[];
}

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <div className="flex flex-col items-center text-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="text-gray-400 mb-2">{icon}</div>
      <div className="text-2xl md:text-3xl font-bold text-black mb-1 tracking-tight">{value}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
    </div>
  );
}

export default function StatisticsCard({ workouts }: StatisticsCardProps) {
  const stats = useMemo(() => getGroupStatistics(workouts), [workouts]);

  if (workouts.length === 0) {
    return (
      <div className="card-modern">
        <h2 className="heading-sm text-black mb-4 tracking-tight">Group Statistics</h2>
        <div className="text-center py-8">
          <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 body-sm">No workouts logged yet</p>
        </div>
      </div>
    );
  }

  // Format numbers nicely
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  const formatPace = (pace: number): string => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  return (
    <div className="card-modern">
      <h2 className="heading-sm text-black mb-4 tracking-tight">Group Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatItem
          icon={<Flame className="w-5 h-5" />}
          value={formatNumber(stats.totalCalories)}
          label="Calories"
        />
        <StatItem
          icon={<Footprints className="w-5 h-5" />}
          value={`${stats.totalKilometers.toFixed(1)}`}
          label="Kilometers"
        />
        <StatItem
          icon={<Activity className="w-5 h-5" />}
          value={stats.totalWorkouts.toString()}
          label="Workouts"
        />
        <StatItem
          icon={<Clock className="w-5 h-5" />}
          value={formatDuration(stats.totalDuration)}
          label="Total Time"
        />
        <StatItem
          icon={<Calendar className="w-5 h-5" />}
          value={stats.activeDays.toString()}
          label="Active Days"
        />
        {stats.averagePace && (
          <StatItem
            icon={<TrendingUp className="w-5 h-5" />}
            value={formatPace(stats.averagePace)}
            label="Avg Pace"
          />
        )}
        {stats.currentStreak > 0 && (
          <StatItem
            icon={<TrendingUp className="w-5 h-5" />}
            value={`${stats.currentStreak}`}
            label="Day Streak"
          />
        )}
        {stats.averageCaloriesPerWorkout && (
          <StatItem
            icon={<Target className="w-5 h-5" />}
            value={formatNumber(stats.averageCaloriesPerWorkout)}
            label="Avg Calories"
          />
        )}
      </div>
    </div>
  );
}
