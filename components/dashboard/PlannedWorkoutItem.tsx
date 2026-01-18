'use client';

import {
  Activity,
  Bike,
  Dumbbell,
  Footprints,
  Waves,
  Clock,
  Gauge,
  Repeat,
  Target,
} from 'lucide-react';
import type { GroupPlanSettings, PlannedWorkout } from '@/lib/db';

interface PlannedWorkoutItemProps {
  workout: string | PlannedWorkout;
  settings: GroupPlanSettings;
  isToday?: boolean;
  isCompleted?: boolean;
}

function getWorkoutIcon(type: string) {
  const sizeClass = 'w-3.5 h-3.5';
  switch (type) {
    case 'Run':
      return <Footprints className={sizeClass} />;
    case 'Bike':
      return <Bike className={sizeClass} />;
    case 'Swim':
      return <Waves className={sizeClass} />;
    case 'Strength':
      return <Dumbbell className={sizeClass} />;
    case 'Rest':
      return <Activity className={sizeClass} />;
    default:
      return <Activity className={sizeClass} />;
  }
}

function getWorkoutColor(type: string, colorTheme: string) {
  const baseColors = {
    Run: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-600',
    },
    Bike: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'text-blue-600',
    },
    Swim: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-700',
      icon: 'text-cyan-600',
    },
    Strength: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      icon: 'text-purple-600',
    },
    Rest: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
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

  return colors;
}

export default function PlannedWorkoutItem({
  workout,
  settings,
  isCompleted = false,
}: PlannedWorkoutItemProps) {
  const isString = typeof workout === 'string';
  const plannedWorkout: PlannedWorkout = isString
    ? { type: 'Other', description: workout }
    : workout;

  const colors = getWorkoutColor(plannedWorkout.type, settings.colorTheme);
  const icon = getWorkoutIcon(plannedWorkout.type);

  // If not completed, use muted colors
  const textColor = isCompleted ? colors.text : 'text-gray-500';
  const bgColor = isCompleted ? colors.bg : 'bg-transparent';
  const borderColor = isCompleted ? colors.border : 'border-gray-200';
  const iconColor = isCompleted ? colors.icon : 'text-gray-400';

  // Build detail parts with icons based on showDetails setting
  const buildDetailParts = () => {
    if (!settings.showDetails || plannedWorkout.type === 'Rest') return [];

    const parts: Array<{ icon: JSX.Element; text: string }> = [];

    // Amount/distance with unit
    if (plannedWorkout.amount !== undefined && plannedWorkout.amount !== null) {
      const unit = plannedWorkout.unit || (plannedWorkout.type === 'Swim' ? 'm' : 'km');
      parts.push({
        icon: <Target className="w-2.5 h-2.5" />,
        text: `${plannedWorkout.amount} ${unit}`,
      });
    }

    // Duration
    if (plannedWorkout.duration !== undefined && plannedWorkout.duration !== null) {
      parts.push({
        icon: <Clock className="w-2.5 h-2.5" />,
        text: `${plannedWorkout.duration} min`,
      });
    }

    // Average pace (for Run)
    if (
      plannedWorkout.avgPace !== undefined &&
      plannedWorkout.avgPace !== null &&
      plannedWorkout.type === 'Run'
    ) {
      parts.push({
        icon: <Gauge className="w-2.5 h-2.5" />,
        text: `${plannedWorkout.avgPace.toFixed(1)} min/km`,
      });
    }

    // Intervals
    if (plannedWorkout.intervals && plannedWorkout.intervals.length > 0) {
      parts.push({
        icon: <Repeat className="w-2.5 h-2.5" />,
        text: `${plannedWorkout.intervals.length} interval${plannedWorkout.intervals.length > 1 ? 's' : ''}`,
      });
    }

    // Exercises
    if (plannedWorkout.exercises && plannedWorkout.exercises.length > 0) {
      parts.push({
        icon: <Dumbbell className="w-2.5 h-2.5" />,
        text: `${plannedWorkout.exercises.length} exercise${plannedWorkout.exercises.length > 1 ? 's' : ''}`,
      });
    }

    return parts;
  };

  if (settings.displayStyle === 'compact') {
    const detailParts = buildDetailParts();
    const mainText = plannedWorkout.type === 'Rest' ? 'Rest' : plannedWorkout.type;

    return (
      <div className={`inline-flex items-center gap-1 ${textColor}`}>
        {settings.showIcons && <span className={iconColor}>{icon}</span>}
        <span className="text-xs font-medium">{mainText}</span>
        {detailParts.length > 0 && (
          <span className="text-xs text-gray-400 flex items-center gap-0.5">
            {detailParts[0].icon}
            {detailParts[0].text}
          </span>
        )}
      </div>
    );
  }

  if (settings.displayStyle === 'expanded') {
    const detailParts = buildDetailParts();

    // Primary text: type or notes/description
    let primaryText =
      plannedWorkout.type === 'Rest'
        ? 'Rest Day'
        : plannedWorkout.notes || plannedWorkout.description || plannedWorkout.type;

    // If we have amount but no notes/description, show type with amount
    if (
      !plannedWorkout.notes &&
      !plannedWorkout.description &&
      plannedWorkout.amount !== undefined
    ) {
      primaryText = plannedWorkout.type;
    }

    return (
      <div
        className={`w-full flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${bgColor} ${borderColor}`}
      >
        {settings.showIcons && <span className={`${iconColor} flex-shrink-0`}>{icon}</span>}
        <div className="min-w-0">
          <div className={`text-xs font-medium ${textColor} truncate`}>{primaryText}</div>
          {detailParts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {detailParts.map((part) => (
                <span key={part.text} className="flex items-center gap-0.5 text-xs text-gray-500">
                  <span className="text-gray-400">{part.icon}</span>
                  <span>{part.text}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // detailed style
  const detailParts = buildDetailParts();
  const displayText = plannedWorkout.type === 'Rest' ? 'Rest Day' : plannedWorkout.type;

  return (
    <div
      className={`w-full flex flex-col gap-1.5 px-2.5 py-2 rounded-lg border ${bgColor} ${borderColor}`}
    >
      <div className="flex items-center gap-1">
        {settings.showIcons && <span className={`${iconColor} flex-shrink-0`}>{icon}</span>}
        <span className={`text-xs font-semibold ${textColor}`}>{displayText}</span>
      </div>
      {detailParts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 ml-5.5">
          {detailParts.map((part) => (
            <span key={part.text} className="flex items-center gap-0.5 text-xs text-gray-500">
              <span className="text-gray-400">{part.icon}</span>
              <span>{part.text}</span>
            </span>
          ))}
        </div>
      )}
      {settings.showDetails && plannedWorkout.notes && (
        <div className="text-xs text-gray-500 ml-5.5 mt-0.5">{plannedWorkout.notes}</div>
      )}
    </div>
  );
}
