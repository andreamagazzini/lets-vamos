import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { Interval } from '@/lib/db';

interface IntervalsSectionProps {
  type: 'Run' | 'Bike' | 'Swim';
  intervals: Interval[];
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof Interval, value: string | number | undefined) => void;
}

export default function IntervalsSection({
  type,
  intervals,
  expanded,
  onToggle,
  onAdd,
  onRemove,
  onUpdate,
}: IntervalsSectionProps) {
  const getTypeColor = (intervalType: string) => {
    switch (intervalType) {
      case 'warmup':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'work':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'cooldown':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'recovery':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeLabel = (intervalType: string) => {
    switch (intervalType) {
      case 'warmup':
        return 'Warmup';
      case 'work':
        return 'Work';
      case 'cooldown':
        return 'Cooldown';
      case 'recovery':
        return 'Recovery';
      default:
        return intervalType;
    }
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full mb-4 hover:opacity-80 transition-opacity"
      >
        <h3 className="text-base font-bold text-gray-900">Intervals (Optional)</h3>
        <div className="flex items-center gap-2">
          {intervals.length > 0 && (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {intervals.length} {intervals.length === 1 ? 'interval' : 'intervals'}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="space-y-4">
          {intervals.length === 0 && (
            <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-500 mb-2">No intervals added yet</p>
              <p className="text-xs text-gray-400">Click "Add Interval" to create your first interval</p>
            </div>
          )}

          {intervals.map((interval, index) => (
            <div
              key={`interval-${index}-${interval.type}`}
              className="p-5 bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Interval Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </span>
                  <select
                    value={interval.type}
                    onChange={(e) =>
                      onUpdate(index, 'type', e.target.value as 'warmup' | 'work' | 'cooldown' | 'recovery')
                    }
                    className="px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50 hover:bg-white"
                  >
                    <option value="warmup">Warmup</option>
                    <option value="work">Work</option>
                    <option value="cooldown">Cooldown</option>
                    <option value="recovery">Recovery</option>
                  </select>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getTypeColor(interval.type)}`}
                  >
                    {getTypeLabel(interval.type)}
                  </span>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`interval-${index}-repeats`}
                      className="text-xs font-semibold text-gray-600 whitespace-nowrap"
                    >
                      Repeats:
                    </label>
                    <input
                      id={`interval-${index}-repeats`}
                      type="number"
                      min="1"
                      step="1"
                      value={interval.repeats || 1}
                      onChange={(e) =>
                        onUpdate(
                          index,
                          'repeats',
                          e.target.value === '' || e.target.value === '1'
                            ? undefined
                            : parseInt(e.target.value, 10)
                        )
                      }
                      className="w-16 px-2 py-1.5 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                      placeholder="1"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200 hover:shadow-md shrink-0"
                  aria-label="Remove interval"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label
                    htmlFor={`interval-${index}-distance`}
                    className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide"
                  >
                    Distance ({type === 'Swim' ? 'm' : 'km'})
                  </label>
                  <input
                    id={`interval-${index}-distance`}
                    type="number"
                    step={type === 'Swim' ? '1' : '0.1'}
                    value={interval.distance || ''}
                    onChange={(e) =>
                      onUpdate(
                        index,
                        'distance',
                        e.target.value === '' ? undefined : parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                    placeholder={type === 'Swim' ? '100' : '0.4'}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`interval-${index}-time`}
                    className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide"
                  >
                    Time (sec)
                  </label>
                  <input
                    id={`interval-${index}-time`}
                    type="number"
                    value={interval.time || ''}
                    onChange={(e) =>
                      onUpdate(
                        index,
                        'time',
                        e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                    placeholder="90"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`interval-${index}-pace`}
                    className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide"
                  >
                    Pace (min/{type === 'Swim' ? '100m' : 'km'})
                  </label>
                  <input
                    id={`interval-${index}-pace`}
                    type="number"
                    step="0.1"
                    value={interval.pace || ''}
                    onChange={(e) =>
                      onUpdate(
                        index,
                        'pace',
                        e.target.value === '' ? undefined : parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                    placeholder="3.75"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`interval-${index}-hr`}
                    className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide"
                  >
                    Heart Rate (bpm)
                  </label>
                  <input
                    id={`interval-${index}-hr`}
                    type="number"
                    value={interval.avgHeartRate || ''}
                    onChange={(e) =>
                      onUpdate(
                        index,
                        'avgHeartRate',
                        e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                    placeholder="175"
                  />
                </div>
              </div>

              {/* Note Field */}
              <div>
                <label
                  htmlFor={`interval-${index}-note`}
                  className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide"
                >
                  Note (optional)
                </label>
                <input
                  id={`interval-${index}-note`}
                  type="text"
                  value={interval.note || ''}
                  onChange={(e) => onUpdate(index, 'note', e.target.value || undefined)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                  placeholder="e.g., Easy pace, focus on form"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary bg-primary/10 border-2 border-primary rounded-full hover:bg-primary hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Interval
          </button>
        </div>
      )}
    </div>
  );
}
