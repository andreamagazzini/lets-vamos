// Date utility functions for consistent date handling
import { addDays, format, isToday, isValid, isYesterday, parseISO, startOfWeek } from 'date-fns';

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
export function getTodayDateString(): string {
  const today = new Date();
  // Use UTC to avoid timezone issues
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string for display
 * Shows "Today", "Yesterday", or formatted date
 */
export function formatDateForDisplay(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return dateString;
    }

    if (isToday(date)) {
      return 'Today';
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  } catch {
    return dateString;
  }
}

/**
 * Format a date string for full display
 */
export function formatDateFull(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return dateString;
    }
    return format(date, 'MMMM d, yyyy');
  } catch {
    return dateString;
  }
}

/**
 * Get the Monday date (start of week) for a given date
 * Returns date string in format "YYYY-MM-DD" (UTC)
 */
export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(date);
  // Get Monday of the week (week starts on Monday)
  const monday = startOfWeek(d, { weekStartsOn: 1 });
  // Use local time methods to match startOfWeek behavior
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start (Monday) and end (Sunday) dates for a week key
 */
export function getWeekRange(weekKey: string): { start: Date; end: Date } {
  const start = parseISO(weekKey);
  if (!isValid(start)) {
    throw new Error(`Invalid week key: ${weekKey}`);
  }
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Get previous or next week key
 */
export function getAdjacentWeekKey(weekKey: string, direction: 'prev' | 'next'): string {
  const date = parseISO(weekKey);
  if (!isValid(date)) {
    throw new Error(`Invalid week key: ${weekKey}`);
  }
  const days = direction === 'prev' ? -7 : 7;
  const newDate = addDays(date, days);
  return getWeekKey(newDate);
}

/**
 * Get days until a goal date
 */
export function getDaysUntilGoal(goalDate: string): number {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const goal = parseISO(goalDate);
    if (!isValid(goal)) {
      return 0;
    }
    goal.setHours(0, 0, 0, 0);
    const diff = goal.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Validate if a date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch {
    return false;
  }
}

/**
 * Check if a date is in the future
 */
export function isDateInFuture(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return false;
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  } catch {
    return false;
  }
}

/**
 * Check if a date is in the past (before today)
 */
export function isDateInPast(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  } catch {
    return false;
  }
}

/**
 * Get day index from day of week (0 = Sunday, 1 = Monday, etc.)
 */
export function getDayIndex(dayOfWeek: number): number {
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

/**
 * Check if a day index is today
 */
export function isTodayDay(dayIndex: number): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay();
  return dayIndex === getDayIndex(dayOfWeek);
}
