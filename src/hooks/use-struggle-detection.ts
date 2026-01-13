"use client";

import { useMemo } from "react";
import { useQuery, evolu, sqliteTrue } from "@/lib/evolu/schema";
import { useUserSettings, useTaperingPhases } from "@/lib/evolu/hooks";

interface StruggleDetectionResult {
  /**
   * Whether the user appears to be struggling (≥3 over-limit days in the last week)
   */
  isStruggling: boolean;

  /**
   * Number of days over limit in the last 7 days
   */
  overLimitDays: number;

  /**
   * Total days analyzed (with logs)
   */
  totalDaysWithLogs: number;

  /**
   * Current daily limit based on active phase
   */
  currentDailyLimit: number;

  /**
   * Whether the current phase has already been extended
   */
  currentPhaseExtended: boolean;

  /**
   * Whether suggestion should be shown (isStruggling && not dismissed)
   */
  shouldShowSuggestion: boolean;
}

// Create query outside the component for stability
const recentLogsQuery = evolu.createQuery((db) =>
  db
    .selectFrom("pouchLog")
    .select(["id", "timestamp", "isOverLimit"])
    .where("isDeleted", "is not", sqliteTrue)
    .orderBy("timestamp", "desc")
);

/**
 * Hook to detect when a user is struggling to stay within their daily limits.
 *
 * Struggle is detected when the user exceeds their daily limit on 3 or more
 * days in the last week. This triggers a compassionate suggestion to extend
 * the current phase.
 */
export function useStruggleDetection(): StruggleDetectionResult {
  const settings = useUserSettings();
  const phases = useTaperingPhases();

  // Get logs from the last 7 days
  const recentLogs = useQuery(recentLogsQuery);

  return useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get current phase info
    const currentPhaseNum = settings?.currentPhase ?? 1;
    const currentPhase = phases.find((p) => p.phaseNumber === currentPhaseNum);
    const currentDailyLimit =
      currentPhase?.dailyLimit ?? settings?.baselineDailyPouches ?? 10;
    const currentPhaseExtended = Boolean(currentPhase?.isExtended);

    // Group logs by date (last 7 days only)
    const logsByDate = new Map<string, number>();

    for (const log of recentLogs) {
      if (!log.timestamp) continue;

      const logDate = new Date(log.timestamp);
      // Only consider logs from the last 7 days (excluding today since it's incomplete)
      if (logDate >= sevenDaysAgo && logDate < today) {
        const dateStr = log.timestamp.split("T")[0];
        logsByDate.set(dateStr, (logsByDate.get(dateStr) || 0) + 1);
      }
    }

    // Count days over limit
    let overLimitDays = 0;
    for (const [, count] of logsByDate) {
      if (count > currentDailyLimit) {
        overLimitDays++;
      }
    }

    const totalDaysWithLogs = logsByDate.size;

    // User is struggling if they exceeded limit on 3+ days out of the last 7
    // Only trigger if they have at least 3 days of data
    const isStruggling = totalDaysWithLogs >= 3 && overLimitDays >= 3;

    // Only show suggestion if struggling and phase hasn't been extended yet
    const shouldShowSuggestion = isStruggling && !currentPhaseExtended;

    return {
      isStruggling,
      overLimitDays,
      totalDaysWithLogs,
      currentDailyLimit,
      currentPhaseExtended,
      shouldShowSuggestion,
    };
  }, [recentLogs, settings, phases]);
}
