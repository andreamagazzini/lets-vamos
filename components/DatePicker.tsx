'use client';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  error,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUp, setOpensUp] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      return new Date(value);
    }
    return minDate && minDate > new Date() ? minDate : new Date();
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedDate = value ? new Date(value) : null;
  const min = minDate || new Date(0); // Default to epoch if no minDate
  const max = maxDate || new Date('2099-12-31'); // Default to far future if no maxDate
  const minDateStart = startOfDay(min);
  const maxDateStart = startOfDay(max);

  // Check if dropdown should open upward
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const dropdownHeight = 400; // Approximate height of the calendar dropdown

      // Open upward if there's not enough space below but enough space above
      setOpensUp(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Update current month when value changes
  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value));
    }
  }, [value]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay();
  // Adjust to Monday = 0
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Create array of day names (Mon-Sun)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Always show 6 weeks (42 days) for consistent height
  const totalCells = 42;

  // Add days from previous month to fill the first week if needed
  const daysBeforeMonth: Date[] = [];
  if (adjustedFirstDay > 0) {
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - (i + 1));
      daysBeforeMonth.push(date);
    }
  }

  // Add days from next month to fill the last week if needed
  const daysAfterMonth: Date[] = [];
  const totalDaysShown = daysBeforeMonth.length + daysInMonth.length;
  const remainingDays = totalCells - totalDaysShown;
  if (remainingDays > 0) {
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + i);
      daysAfterMonth.push(date);
    }
  }

  const handleDateSelect = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    onChange(dateStr);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentMonth(subMonths(currentMonth, 1));
      setIsTransitioning(false);
    }, 150);
  };

  const handleNextMonth = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentMonth(addMonths(currentMonth, 1));
      setIsTransitioning(false);
    }, 150);
  };

  const handleToday = () => {
    const today = new Date();
    if (today >= minDateStart && today <= maxDateStart) {
      handleDateSelect(today);
    }
  };

  const isDateDisabled = (date: Date) => {
    return date < minDateStart || date > maxDateStart;
  };

  const displayValue = selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-6 py-4 border-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white text-gray-900 font-medium flex items-center justify-between ${
          error ? 'border-red-300' : 'border-gray-200'
        } ${isOpen ? 'border-primary' : ''}`}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-label="Select date"
      >
        <span className={selectedDate ? 'text-gray-900' : 'text-gray-400'}>{displayValue}</span>
        <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 bg-white border-2 border-gray-200 rounded-2xl shadow-lg z-50 p-2 ${
            opensUp ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={isTransitioning}
              className="p-1 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div
              className={`font-semibold text-sm text-gray-900 transition-opacity ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}
            >
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={isTransitioning}
              className="p-1 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-[10px] font-semibold text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid - Always 6 weeks for consistent height */}
          <div className="grid grid-cols-7 gap-0.5 min-h-[240px]">
            {/* Days from previous month */}
            {daysBeforeMonth.map((date) => {
              const isDisabled = isDateDisabled(date);
              return (
                <button
                  key={`prev-${date.toISOString()}`}
                  type="button"
                  onClick={() => !isDisabled && handleDateSelect(date)}
                  disabled={isDisabled}
                  className={`
                    aspect-square flex items-center justify-center text-xs font-medium rounded-md transition-colors
                    ${
                      isDisabled
                        ? 'text-gray-200 cursor-not-allowed'
                        : 'text-gray-400 hover:bg-gray-50'
                    }
                  `}
                  aria-label={format(date, 'MMMM d, yyyy')}
                >
                  {format(date, 'd')}
                </button>
              );
            })}

            {/* Days in current month */}
            {daysInMonth.map((date) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);
              const isDisabled = isDateDisabled(date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => !isDisabled && handleDateSelect(date)}
                  disabled={isDisabled}
                  className={`
                    aspect-square flex items-center justify-center text-xs font-medium rounded-md transition-colors
                    ${
                      isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : isSelected
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : isTodayDate
                            ? 'bg-primary/10 text-primary hover:bg-primary/20 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  aria-label={format(date, 'MMMM d, yyyy')}
                >
                  {format(date, 'd')}
                </button>
              );
            })}

            {/* Days from next month */}
            {daysAfterMonth.map((date) => {
              const isDisabled = isDateDisabled(date);
              return (
                <button
                  key={`next-${date.toISOString()}`}
                  type="button"
                  onClick={() => !isDisabled && handleDateSelect(date)}
                  disabled={isDisabled}
                  className={`
                    aspect-square flex items-center justify-center text-xs font-medium rounded-md transition-colors
                    ${
                      isDisabled
                        ? 'text-gray-200 cursor-not-allowed'
                        : 'text-gray-400 hover:bg-gray-50'
                    }
                  `}
                  aria-label={format(date, 'MMMM d, yyyy')}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          {(() => {
            const today = new Date();
            return !isDateDisabled(today);
          })() && (
            <button
              type="button"
              onClick={handleToday}
              className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Today
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
