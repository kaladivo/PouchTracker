"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export type TimerState = "counting" | "available" | "sleeping";

interface UseTimerOptions {
  lastPouchTime: Date | null;
  intervalMinutes: number;
  wakeTime: string; // "HH:MM"
  sleepTime: string; // "HH:MM"
  dailyLimit: number;
  todayCount: number;
}

interface UseTimerReturn {
  state: TimerState;
  timeRemaining: number; // seconds
  formattedTime: string; // "H:MM:SS" or "MM:SS"
  progress: number; // 0-100
  isOverLimit: boolean;
  secondsWaitedPastTimer: number; // How long user has waited past the "available" time
}

/**
 * Parse "HH:MM" time string to minutes since midnight
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if current time is within sleep hours
 */
function isInSleepHours(wakeTime: string, sleepTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const wake = parseTimeToMinutes(wakeTime);
  const sleep = parseTimeToMinutes(sleepTime);

  // Handle overnight sleep (e.g., sleep at 23:00, wake at 07:00)
  if (sleep > wake) {
    // Normal case: awake during day
    return currentMinutes >= sleep || currentMinutes < wake;
  } else {
    // Sleep spans midnight
    return currentMinutes >= sleep && currentMinutes < wake;
  }
}

/**
 * Calculate seconds until wake time
 */
function getSecondsUntilWake(wakeTime: string): number {
  const now = new Date();
  const [wakeHours, wakeMinutes] = wakeTime.split(":").map(Number);

  const wakeDate = new Date(now);
  wakeDate.setHours(wakeHours, wakeMinutes, 0, 0);

  // If wake time has passed today, it's tomorrow
  if (wakeDate <= now) {
    wakeDate.setDate(wakeDate.getDate() + 1);
  }

  return Math.floor((wakeDate.getTime() - now.getTime()) / 1000);
}

/**
 * Format seconds to human-readable time
 */
function formatTime(seconds: number): string {
  if (seconds <= 0) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function useTimer({
  lastPouchTime,
  intervalMinutes,
  wakeTime,
  sleepTime,
  dailyLimit,
  todayCount,
}: UseTimerOptions): UseTimerReturn {
  const [now, setNow] = useState(() => new Date());

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isOverLimit = todayCount >= dailyLimit;
  const isSleeping = useMemo(
    () => isInSleepHours(wakeTime, sleepTime),
    [wakeTime, sleepTime, now] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const calculateTimeRemaining = useCallback((): number => {
    if (!lastPouchTime) return 0; // No previous pouch, can use one now

    const intervalMs = intervalMinutes * 60 * 1000;
    const nextAllowedTime = new Date(lastPouchTime.getTime() + intervalMs);
    const remaining = Math.max(0, nextAllowedTime.getTime() - now.getTime());

    return Math.ceil(remaining / 1000);
  }, [lastPouchTime, intervalMinutes, now]);

  const timeRemaining = calculateTimeRemaining();

  const state: TimerState = useMemo(() => {
    if (isSleeping) return "sleeping";
    if (timeRemaining <= 0) return "available";
    return "counting";
  }, [isSleeping, timeRemaining]);

  const displayTime = useMemo(() => {
    if (state === "sleeping") {
      return getSecondsUntilWake(wakeTime);
    }
    return timeRemaining;
  }, [state, timeRemaining, wakeTime]);

  const progress = useMemo(() => {
    if (state === "available") return 100;
    if (!lastPouchTime) return 100;

    const intervalMs = intervalMinutes * 60 * 1000;
    const elapsed = now.getTime() - lastPouchTime.getTime();
    return Math.min(100, (elapsed / intervalMs) * 100);
  }, [state, lastPouchTime, intervalMinutes, now]);

  // Calculate how long user has been waiting past when they could have taken a pouch
  const secondsWaitedPastTimer = useMemo(() => {
    if (state !== "available" || !lastPouchTime) return 0;

    // Time when the next pouch became available
    const intervalMs = intervalMinutes * 60 * 1000;
    const availableSince = new Date(lastPouchTime.getTime() + intervalMs);

    // How long since it became available
    const waitedMs = now.getTime() - availableSince.getTime();
    return Math.max(0, Math.floor(waitedMs / 1000));
  }, [state, lastPouchTime, intervalMinutes, now]);

  return {
    state,
    timeRemaining: displayTime,
    formattedTime: formatTime(displayTime),
    progress,
    isOverLimit,
    secondsWaitedPastTimer,
  };
}
