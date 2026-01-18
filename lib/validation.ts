// Validation utilities for forms and data

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate that a string is not empty after trimming
 */
export function isNotEmpty(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate that a number is positive
 */
export function isPositiveNumber(value: number | string | undefined): boolean {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !Number.isNaN(num) && num > 0;
}

/**
 * Validate that a number is non-negative
 */
export function isNonNegativeNumber(value: number | string | undefined): boolean {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !Number.isNaN(num) && num >= 0;
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return date instanceof Date && !Number.isNaN(date.getTime());
}

/**
 * Validate route parameter is a non-empty string
 */
export function isValidRouteParam(param: string | string[] | undefined): param is string {
  return typeof param === 'string' && param.length > 0;
}

/**
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Remove potentially dangerous characters
  return input.replace(/[<>]/g, '').trim();
}

/**
 * Validate invite code format (alphanumeric, uppercase)
 */
export function isValidInviteCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  const inviteCodeRegex = /^[A-Z0-9]{6,10}$/;
  return inviteCodeRegex.test(code);
}
