/**
 * Utility functions for calculating date ranges in the local timezone.
 */

/**
 * Gets the start and end of the current day in the local timezone.
 * @returns { startDate: Date, endDate: Date }
 */
export function getTodayRangeLocal(): { startDate: Date, endDate: Date } {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0); // Start of today (local)
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // End of today (local)
  console.log(`[timeUtils] Today Range (Local): ${startDate.toISOString()} to ${endDate.toISOString()}`);
  return { startDate, endDate };
}

/**
 * Gets the start of the current week (Sunday) and the end of the current day in the local timezone.
 * @param weekStartsOnSunday If true, week starts Sunday(0). If false, starts Monday(1). Default true.
 * @returns { startDate: Date, endDate: Date }
 */
export function getCurrentWeekProgressRangeLocal(weekStartsOnSunday: boolean = true): { startDate: Date, endDate: Date } {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  const startDate = new Date(now);
  const dayOffset = weekStartsOnSunday ? currentDayOfWeek : (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1);
  startDate.setDate(now.getDate() - dayOffset);
  startDate.setHours(0, 0, 0, 0); // Start of the first day of the week (local)

  const endDate = new Date(); // End of today (local)
  endDate.setHours(23, 59, 59, 999);

  console.log(`[timeUtils] Current Week Progress Range (Local): ${startDate.toISOString()} to ${endDate.toISOString()}`);
  return { startDate, endDate };
}

/**
 * Gets the start and end of the current full week (e.g., Sun-Sat) in the local timezone.
 * @param weekStartsOnSunday If true, week starts Sunday(0). If false, starts Monday(1). Default true.
 * @returns { startDate: Date, endDate: Date }
 */
export function getCurrentFullWeekRangeLocal(weekStartsOnSunday: boolean = true): { startDate: Date, endDate: Date } {
  const { startDate: startOfWeek } = getCurrentWeekProgressRangeLocal(weekStartsOnSunday);
  const endDate = new Date(startOfWeek);
  endDate.setDate(startOfWeek.getDate() + 6); // Go to the end of the week (Saturday or Sunday)
  endDate.setHours(23, 59, 59, 999);

  console.log(`[timeUtils] Current Full Week Range (Local): ${startOfWeek.toISOString()} to ${endDate.toISOString()}`);
  return { startDate: startOfWeek, endDate };
}

/**
 * Gets the start and end for the last N days, ending today.
 * @param days Number of days to look back.
 * @returns { startDate: Date, endDate: Date }
 */
export function getLastNDaysRangeLocal(days: number): { startDate: Date, endDate: Date } {
  const endDate = new Date(); // End of today
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1)); // Go back N-1 days to include today
  startDate.setHours(0, 0, 0, 0); // Start of the first day

  console.log(`[timeUtils] Last ${days} Days Range (Local): ${startDate.toISOString()} to ${endDate.toISOString()}`);
  return { startDate, endDate };
}

/**
 * Format a timestamp for chart display, showing time only
 * @param timestamp - Timestamp in milliseconds
 * @returns Formatted time string (HH:MM:SS)
 */
export function formatChartTimestamp(timestamp: number): string {
  // Guard against invalid timestamps
  if (!timestamp || isNaN(timestamp)) {
    return '';
  }
  
  const date = new Date(timestamp);
  
  // Check if date is valid (catches the 1970 issue)
  if (date.getFullYear() <= 1970 && timestamp > 0) {
    // If timestamp seems to be in seconds rather than milliseconds, convert
    const dateFromSeconds = new Date(timestamp * 1000);
    if (dateFromSeconds.getFullYear() > 1970) {
      return dateFromSeconds.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
  }
  
  // Standard formatting for valid dates
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

/**
 * Format a timestamp for user-friendly display, including contextual date info
 * @param timestamp - Timestamp in milliseconds
 * @returns Formatted date/time string
 */
export function formatUserFriendlyDateTime(timestamp: number): string {
  // Guard against invalid timestamps
  if (!timestamp || isNaN(timestamp)) {
    return 'Invalid date';
  }
  
  const date = new Date(timestamp);
  
  // Check if date is valid (catches the 1970 issue)
  if (date.getFullYear() <= 1970 && timestamp > 0) {
    // If timestamp seems to be in seconds rather than milliseconds, convert
    const dateFromSeconds = new Date(timestamp * 1000);
    if (dateFromSeconds.getFullYear() > 1970) {
      return formatDateTimeRelative(dateFromSeconds);
    }
    return 'Invalid date';
  }
  
  return formatDateTimeRelative(date);
}

/**
 * Helper function to format date with relative terms (Today, Yesterday)
 */
function formatDateTimeRelative(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
           ', ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
} 