"use client";

import { useMemo } from "react";
import { useQuery, evolu, sqliteTrue } from "@/lib/evolu/schema";
import { useUserSettings } from "@/lib/evolu/hooks";

interface DailyStats {
  date: string;
  count: number;
  underLimit: boolean;
}

interface UseStatsReturn {
  // Streak
  currentStreak: number;
  longestStreak: number;

  // Reduction
  reductionPercent: number | null; // null when insufficient data
  reductionExceedsBaseline: boolean; // true when usage > baseline (for warning indicator)
  daysWithData: number; // number of completed days with logged data (last 7, excluding today)
  baselineDaily: number;
  currentAverage: number;

  // Today
  todayCount: number;
  todayLimit: number;

  // Weekly data (last 7 days)
  weeklyData: DailyStats[];
  weeklyTotal: number;
  weeklyAverage: number;

  // Monthly data (last 30 days)
  monthlyData: DailyStats[];
  monthlyTotal: number;
  monthlyAverage: number;

  // Triggers breakdown
  triggerCounts: Record<string, number>;

  // Journey
  daysSinceStart: number;
  totalPouchesLogged: number;
}

// Create query outside the component for stability
const allLogsQuery = evolu.createQuery((db) =>
  db
    .selectFrom("pouchLog")
    .select(["id", "timestamp", "strengthMg", "trigger", "isOverLimit"])
    .where("isDeleted", "is not", sqliteTrue)
    .orderBy("timestamp", "desc")
);

/**
 * Hook to calculate statistics from pouch logs
 */
export function useStats(): UseStatsReturn {
  const settings = useUserSettings();

  // Get all pouch logs
  const allLogs = useQuery(allLogsQuery);

  return useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Group logs by date
    type LogEntry = (typeof allLogs)[number];
    const logsByDate = new Map<string, LogEntry[]>();
    for (const log of allLogs) {
      if (!log.timestamp) continue;
      const date = log.timestamp.split("T")[0];
      if (!logsByDate.has(date)) {
        logsByDate.set(date, []);
      }
      logsByDate.get(date)!.push(log);
    }

    // Calculate daily stats for the last 30 days
    const dailyStats: DailyStats[] = [];
    const baselineDaily = settings?.baselineDailyPouches ?? 10;

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const logs = logsByDate.get(dateStr) || [];
      const count = logs.length;

      dailyStats.push({
        date: dateStr,
        count,
        underLimit: count <= baselineDaily,
      });
    }

    // Weekly data (last 7 days including today for display)
    const weeklyData = dailyStats.slice(0, 7).reverse();
    const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.count, 0);
    const weeklyAverage =
      weeklyData.length > 0 ? weeklyTotal / weeklyData.length : 0;

    // For reduction calculation: exclude today, only count days with logged data
    // dailyStats[0] is today, so we start from index 1
    const completedDaysWithData = dailyStats
      .slice(1, 8) // Last 7 completed days (excluding today)
      .filter((d) => d.count > 0);
    const daysWithData = completedDaysWithData.length;

    // Monthly data (last 30 days)
    const monthlyData = dailyStats.reverse();
    const monthlyTotal = monthlyData.reduce((sum, d) => sum + d.count, 0);
    const monthlyDaysWithData =
      monthlyData.filter((d) => d.count > 0).length || 1;
    const monthlyAverage = monthlyTotal / monthlyDaysWithData;

    // Today's count
    const todayStr = today.toISOString().split("T")[0];
    const todayLogs = logsByDate.get(todayStr) || [];
    const todayCount = todayLogs.length;
    const todayLimit = settings?.baselineDailyPouches ?? 10;

    // Calculate streak (consecutive days at or under baseline)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Start from yesterday (don't count today as it's in progress)
    for (let i = 1; i < dailyStats.length; i++) {
      const day = dailyStats[dailyStats.length - 1 - i];
      if (day.count > 0 && day.underLimit) {
        tempStreak++;
        if (i === 1) currentStreak = tempStreak;
      } else if (day.count > 0) {
        // Over limit, break streak
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
        if (i === 1) currentStreak = 0;
      }
      // If no logs for a day, continue streak (don't penalize rest days)
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // If today is under limit, add it to current streak
    if (todayCount > 0 && todayCount <= todayLimit) {
      currentStreak++;
    }

    // Reduction percentage calculation
    // Uses completed days only (excluding today), requires minimum 3 days with data
    const MIN_DAYS_FOR_REDUCTION = 3;

    let reductionPercent: number | null = null;
    let reductionExceedsBaseline = false;
    let currentAverage = 0;

    if (daysWithData >= MIN_DAYS_FOR_REDUCTION && baselineDaily > 0) {
      // Calculate average from completed days with logged data only
      const totalFromCompletedDays = completedDaysWithData.reduce(
        (sum, d) => sum + d.count,
        0
      );
      currentAverage = totalFromCompletedDays / daysWithData;

      // Calculate raw reduction percentage
      const rawReduction = Math.round(
        ((baselineDaily - currentAverage) / baselineDaily) * 100
      );

      // Cap at 0-100%, track if exceeds baseline
      if (rawReduction < 0) {
        reductionPercent = 0;
        reductionExceedsBaseline = true;
      } else {
        reductionPercent = Math.min(rawReduction, 100);
        reductionExceedsBaseline = false;
      }
    }

    // Trigger counts
    const triggerCounts: Record<string, number> = {};
    for (const log of allLogs) {
      if (log.trigger) {
        triggerCounts[log.trigger] = (triggerCounts[log.trigger] || 0) + 1;
      }
    }

    // Days since start
    const startDate = settings?.startDate
      ? new Date(settings.startDate)
      : new Date();
    const daysSinceStart = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      currentStreak,
      longestStreak,
      reductionPercent,
      reductionExceedsBaseline,
      daysWithData,
      baselineDaily,
      currentAverage: Math.round(currentAverage * 10) / 10,
      todayCount,
      todayLimit,
      weeklyData,
      weeklyTotal,
      weeklyAverage: Math.round(weeklyAverage * 10) / 10,
      monthlyData,
      monthlyTotal,
      monthlyAverage: Math.round(monthlyAverage * 10) / 10,
      triggerCounts,
      daysSinceStart,
      totalPouchesLogged: allLogs.length,
    };
  }, [allLogs, settings]);
}
