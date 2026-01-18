// Centralized error handling utilities
import { ERROR_MESSAGES } from './constants';

export interface AppError {
  message: string;
  code?: string;
  originalError?: unknown;
}

/**
 * Convert an error to a user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK;
    }
    if (error.message.includes('unauthorized') || error.message.includes('auth')) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      return ERROR_MESSAGES.NOT_FOUND;
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return ERROR_MESSAGES.VALIDATION;
    }
    if (error.message.includes('database') || error.message.includes('MongoDB')) {
      return ERROR_MESSAGES.DB_ERROR;
    }
    // Return the error message if it's user-friendly
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return ERROR_MESSAGES.GENERIC;
}

/**
 * Create an AppError from an unknown error
 */
export function createAppError(error: unknown, code?: string): AppError {
  return {
    message: getErrorMessage(error),
    code,
    originalError: error,
  };
}

/**
 * Log error for debugging (in development)
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    const prefix = context ? `[${context}]` : '';
    console.error(`${prefix} Error:`, error);
  }
}

/**
 * Handle async operation with error handling
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    logError(error, context);
    const appError = createAppError(error);
    return { data: null, error: appError };
  }
}
