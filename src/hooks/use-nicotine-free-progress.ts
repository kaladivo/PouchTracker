"use client";

import { useMemo } from "react";
import { useQuery, evolu, sqliteTrue } from "@/lib/evolu/schema";
import { useUserSettings, useTaperingPhases } from "@/lib/evolu/hooks";

interface NicotineFreeProgressResult {
  /**
   * Whether the user is in the nicotine-free phase (Phase 5 or 0mg strength)
   */
  isInNicotineFreePhase: boolean;

  /**
   * Number of consecutive nicotine-free days (counting backwards from today)
   */
  consecutiveNicotineFreeDays: number;

  /**
   * Total nicotine-free days in the last 30 days
   */
  totalNicotineFreeDays: number;

  /**
   * Whether user has logged any 0mg pouches today
   */
  hasZeroMgToday: boolean;

  /**
   * Today's 0mg pouch count
   */
  todayZeroMgCount: number;

  /**
   * Today's total pouch count
   */
  todayTotalCount: number;

  /**
   * Progress toward freedom week (7 consecutive days)
   */
  progressToFreedomWeek: number;

  /**
   * Whether freedom week is achieved (7+ consecutive nicotine-free days)
   */
  hasFreedomWeek: boolean;

  /**
   * Whether completely pouch-free today (no pouches at all)
   */
  isPouchFreeToday: boolean;
}

// Create query outside the component for stability
const allLogsQuery = evolu.createQuery((db) =>
  db
    .selectFrom("pouchLog")
    .select(["id", "timestamp", "strengthMg"])
    .where("isDeleted", "is not", sqliteTrue)
    .orderBy("timestamp", "desc")
);

/**
 * Hook to track user's progress in the nicotine-free phase.
 *
 * This detects when the user is using 0mg pouches or has reached
 * the final phase, and tracks their progress toward complete freedom.
 */
export function useNicotineFreeProgress(): NicotineFreeProgressResult {
  const settings = useUserSettings();
  const phases = useTaperingPhases();

  // Get all pouch logs
  const allLogs = useQuery(allLogsQuery);

  return useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if in nicotine-free phase (Phase 5 or current phase has 0mg strength)
    const currentPhaseNum = settings?.currentPhase ?? 1;
    const currentPhase = phases.find((p) => p.phaseNumber === currentPhaseNum);
    const isPhase5 = currentPhaseNum === 5;
    const hasZeroMgPhase = currentPhase?.strengthMg === 0;
    const isInNicotineFreePhase = isPhase5 || hasZeroMgPhase;

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

    // Today's stats
    const todayStr = today.toISOString().split("T")[0];
    const todayLogs = logsByDate.get(todayStr) || [];
    const todayZeroMgCount = todayLogs.filter(
      (log) => log.strengthMg === 0
    ).length;
    const todayTotalCount = todayLogs.length;
    const hasZeroMgToday = todayZeroMgCount > 0;
    const isPouchFreeToday = todayTotalCount === 0;

    // Calculate consecutive nicotine-free days (starting from yesterday)
    // IMPORTANT: A day is only "nicotine-free" if user has logged 0mg pouches.
    // Days with NO logs are "unknown" (user might not have tracked) and break the streak.
    // This prevents new users from showing inflated nicotine-free streaks.
    let consecutiveNicotineFreeDays = 0;
    for (let i = 1; i <= 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayLogs = logsByDate.get(dateStr);

      // A day is nicotine-free ONLY if there are logs AND all logs are 0mg
      // Days with no logs break the streak (unknown state)
      const isNicotineFree =
        dayLogs &&
        dayLogs.length > 0 &&
        dayLogs.every((log) => log.strengthMg === 0);

      if (isNicotineFree) {
        consecutiveNicotineFreeDays++;
      } else {
        break;
      }
    }

    // If today is also nicotine-free (only 0mg or no logs), include it
    const todayNicotineFree =
      todayTotalCount === 0 || todayLogs.every((log) => log.strengthMg === 0);
    if (todayNicotineFree && todayTotalCount > 0) {
      // Only count today if user has logged something (otherwise it's incomplete)
      consecutiveNicotineFreeDays++;
    }

    // Count total nicotine-free days in last 30 days
    let totalNicotineFreeDays = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayLogs = logsByDate.get(dateStr);

      // Skip today if no logs yet
      if (i === 0 && !dayLogs) continue;

      const isNicotineFree =
        dayLogs &&
        dayLogs.length > 0 &&
        dayLogs.every((log) => log.strengthMg === 0);

      if (isNicotineFree) {
        totalNicotineFreeDays++;
      }
    }

    // Progress toward freedom week (7 days)
    const progressToFreedomWeek = Math.min(
      (consecutiveNicotineFreeDays / 7) * 100,
      100
    );
    const hasFreedomWeek = consecutiveNicotineFreeDays >= 7;

    return {
      isInNicotineFreePhase,
      consecutiveNicotineFreeDays,
      totalNicotineFreeDays,
      hasZeroMgToday,
      todayZeroMgCount,
      todayTotalCount,
      progressToFreedomWeek,
      hasFreedomWeek,
      isPouchFreeToday,
    };
  }, [allLogs, settings, phases]);
}
