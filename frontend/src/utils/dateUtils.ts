/**
 * Utility functions for formatting dates and times based on user's locale
 * Automatically detects the user's browser locale/region settings
 */

/**
 * Formats a date with time in the user's locale
 * @param date - Date object or string to format
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options,
  };

  return new Intl.DateTimeFormat(undefined, defaultOptions).format(dateObj);
}

/**
 * Formats only the time in the user's locale
 * @param date - Date object or string to format
 * @param includeSeconds - Whether to include seconds (default: true)
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string,
  includeSeconds: boolean = true
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
  };

  return dateObj.toLocaleTimeString(undefined, options);
}

/**
 * Formats only the date in the user's locale
 * @param date - Date object or string to format
 * @param format - 'short' | 'medium' | 'long' | 'full'
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    },
    medium: {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
    long: {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },
    full: {
      weekday: 'long',
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    },
  };

  return new Intl.DateTimeFormat(undefined, formatMap[format]).format(dateObj);
}

/**
 * Formats a relative time string (e.g., "2 hours ago", "in 3 days")
 * @param date - Date object or string to compare against now
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (Math.abs(diffInSeconds) < 60) {
    return 'just now';
  }

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  const timeUnits: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [unit, secondsInUnit] of timeUnits) {
    const value = Math.floor(diffInSeconds / secondsInUnit);
    if (Math.abs(value) >= 1) {
      return rtf.format(-value, unit);
    }
  }

  return 'just now';
}

/**
 * Formats a number according to user's locale
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  decimals: number = 2
): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats currency according to user's locale
 * @param value - Number to format
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Gets the user's detected locale
 * @returns User's locale string (e.g., 'en-US', 'fr-FR')
 */
export function getUserLocale(): string {
  if (typeof window !== 'undefined') {
    return window.navigator.language || 'en-US';
  }
  return 'en-US';
}

/**
 * Gets the user's timezone
 * @returns User's timezone string (e.g., 'America/New_York')
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
