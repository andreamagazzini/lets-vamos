'use client';

import { Activity, Bike, Dumbbell, Footprints, Waves } from 'lucide-react';
import type { GroupPlanSettings, PlannedWorkout } from '@/lib/db';

interface PlannedWorkoutItemProps {
  workout: string | PlannedWorkout;
  settings: GroupPlanSettings;
  isToday?: boolean;
  isCompleted?: boolean;
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
    case 'Rest':
      return <Activity className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
}

function getWorkoutColor(type: string, colorTheme: string) {
  const baseColors = {
    Run: {
      bg: 'bg-primary-light/10',
      border: 'border-primary-light/30',
      text: 'text-primary',
      icon: 'text-primary-light',
    },
    Bike: {
      bg: 'bg-primary/5',
      border: 'border-primary/20',
      text: 'text-primary',
      icon: 'text-primary',
    },
    Swim: {
      bg: 'bg-accent/10',
      border: 'border-accent/30',
      text: 'text-primary',
      icon: 'text-accent',
    },
    Strength: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      icon: 'text-gray-600',
    },
    Rest: {
      bg: 'bg-gray-100/50',
      border: 'border-gray-200/50',
      text: 'text-gray-500',
      icon: 'text-gray-400',
    },
    Other: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      icon: 'text-gray-600',
    },
  };

  const colors = baseColors[type as keyof typeof baseColors] || baseColors.Other;

  if (colorTheme === 'minimal') {
    return {
      ...colors,
      bg: 'bg-transparent',
      border: 'border-gray-200',
    };
  }

  if (colorTheme === 'vibrant') {
    return {
      ...colors,
      bg: colors.bg.replace('/10', '/20').replace('/5', '/15'),
      border: colors.border.replace('/30', '/50').replace('/20', '/40'),
    };
  }

  return colors;
}

export default function PlannedWorkoutItem({
  workout,
  settings,
  isToday = false,
  isCompleted = false,
}: PlannedWorkoutItemProps) {
  const isString = typeof workout === 'string';
  const plannedWorkout: PlannedWorkout = isString
    ? { type: 'Other', description: workout }
    : workout;

  const colors = getWorkoutColor(plannedWorkout.type, settings.colorTheme);
  const icon = getWorkoutIcon(plannedWorkout.type);

  // If not completed, use muted colors
  const textColor =
    plannedWorkout.type === 'Rest' ? colors.text : isCompleted ? colors.text : 'text-gray-500';

  const bgColor =
    plannedWorkout.type === 'Rest'
      ? colors.bg
      : isCompleted
        ? 'bg-gray-100' // Slightly darker background for completed
        : 'bg-gray-50';

  const borderColor =
    plannedWorkout.type === 'Rest'
      ? colors.border
      : isCompleted
        ? 'border-gray-300' // Slightly darker border for completed
        : 'border-gray-200';

  if (settings.displayStyle === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${textColor}`}>
        {settings.showIcons && (
          <span className={isCompleted ? colors.icon : 'text-gray-400'}>{icon}</span>
        )}
        {plannedWorkout.type !== 'Rest' && (
          <span className="text-xs font-medium">{plannedWorkout.type}</span>
        )}
      </div>
    );
  }

  if (settings.displayStyle === 'expanded') {
    const displayText =
      plannedWorkout.type === 'Rest'
        ? 'Rest Day'
        : plannedWorkout.notes || (plannedWorkout as any).description || plannedWorkout.type;
    return (
      <div
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColor} ${borderColor} ${textColor}`}
      >
        {settings.showIcons && (
          <span className={isCompleted ? colors.icon : 'text-gray-400'}>{icon}</span>
        )}
        <span className="text-sm font-medium">{displayText}</span>
      </div>
    );
  }

  // detailed style - hide details in weekly plan, show only type name
  const displayText = plannedWorkout.type === 'Rest' ? 'Rest Day' : plannedWorkout.type;
  return (
    <div
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColor} ${borderColor} ${textColor}`}
    >
      {settings.showIcons && (
        <span className={isCompleted ? colors.icon : 'text-gray-400'}>{icon}</span>
      )}
      <span className="text-sm font-semibold truncate">{displayText}</span>
    </div>
  );
}
