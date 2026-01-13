import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse "HH:MM" time string to minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate waking hours (in minutes) from wake and sleep times.
 * Handles overnight sleep schedules (e.g., sleep at 23:00, wake at 07:00).
 */
export function calculateWakingMinutes(
  wakeTime: string,
  sleepTime: string
): number {
  const wake = parseTimeToMinutes(wakeTime);
  const sleep = parseTimeToMinutes(sleepTime);

  if (sleep > wake) {
    // Normal case: awake during day (e.g., wake 07:00, sleep 23:00)
    return sleep - wake;
  } else {
    // Sleep spans midnight (e.g., wake 07:00, sleep 02:00)
    return 24 * 60 - wake + sleep;
  }
}

/**
 * Calculate the optimal interval between pouches based on waking hours and daily limit.
 * Returns interval in minutes.
 *
 * @param wakeTime - Wake time in "HH:MM" format
 * @param sleepTime - Sleep time in "HH:MM" format
 * @param dailyLimit - Target number of pouches per day
 */
export function calculateAutoInterval(
  wakeTime: string,
  sleepTime: string,
  dailyLimit: number
): number {
  if (dailyLimit <= 0) return 120; // Default fallback

  const wakingMinutes = calculateWakingMinutes(wakeTime, sleepTime);
  return Math.round(wakingMinutes / dailyLimit);
}

/**
 * Sentinel value indicating "auto" interval mode.
 * When pouchIntervalMinutes is 0, the interval is calculated automatically.
 */
export const AUTO_INTERVAL_VALUE = 0;
