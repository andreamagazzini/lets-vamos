'use client';

import { Calendar, Repeat } from 'lucide-react';
import WeekNavigator from '@/components/dashboard/WeekNavigator';
import { getWeekKey, getWeekRange } from '@/lib/dashboard-utils';

export type PlanMode = 'weekly' | 'week-by-week';

interface PlanModeSelectorProps {
  mode: PlanMode;
  onModeChange: (mode: PlanMode) => void;
  currentWeekKey?: string;
  onWeekChange?: (weekKey: string) => void;
  showWeekNavigator?: boolean;
}

export default function PlanModeSelector({
  mode,
  onModeChange,
  currentWeekKey,
  onWeekChange,
  showWeekNavigator = true,
}: PlanModeSelectorProps) {
  const { start } = currentWeekKey ? getWeekRange(currentWeekKey) : { start: new Date() };

  return (
    <div className="mb-6">
      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Weekly Repeating Plan */}
        <button
          type="button"
          onClick={() => onModeChange('weekly')}
          className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all text-left ${
            mode === 'weekly'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                mode === 'weekly' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Repeat className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Weekly Repeating Plan</h3>
              <p className="text-sm text-gray-600">
                One plan that repeats every week. Perfect for consistent training schedules.
              </p>
            </div>
            {mode === 'weekly' && (
              <div className="absolute top-3 right-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-label="Selected"
                  >
                    <title>Selected</title>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </button>

        {/* Week-by-Week Plan */}
        <button
          type="button"
          onClick={() => onModeChange('week-by-week')}
          className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all text-left ${
            mode === 'week-by-week'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                mode === 'week-by-week' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Week-by-Week Plan</h3>
              <p className="text-sm text-gray-600">
                Customize each week individually. Great for progressive training programs.
              </p>
            </div>
            {mode === 'week-by-week' && (
              <div className="absolute top-3 right-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-label="Selected"
                  >
                    <title>Selected</title>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Week Navigator - Only show in week-by-week mode */}
      {mode === 'week-by-week' && showWeekNavigator && currentWeekKey && onWeekChange && (
        <div className="mb-4">
          <WeekNavigator
            currentWeekKey={currentWeekKey}
            onWeekChange={onWeekChange}
            onToday={() => onWeekChange(getWeekKey())}
          />
        </div>
      )}

      {/* Description Text */}
      <div className="text-sm text-gray-600">
        {mode === 'weekly' ? (
          <p>This plan will repeat every week. Changes apply to all weeks using this plan.</p>
        ) : (
          <p>
            You're editing the plan for the week of{' '}
            <span className="font-semibold text-gray-900">
              {start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            . Navigate between weeks to customize each one.
          </p>
        )}
      </div>
    </div>
  );
}
