"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useQuery, evolu, sqliteTrue } from "@/lib/evolu/schema";
import {
  useUserSettings,
  useTaperingPhases,
  useMetricEvents,
} from "@/lib/evolu/hooks";
import { useAchievementsManager } from "./use-achievements";

// Create queries outside the component for stability
const allLogsQuery = evolu.createQuery((db) =>
  db
    .selectFrom("pouchLog")
    .select(["id", "timestamp", "strengthMg", "trigger", "isOverLimit"])
    .where("isDeleted", "is not", sqliteTrue)
    .orderBy("timestamp", "desc")
);

const reflectionsQuery = evolu.createQuery((db) =>
  db
    .selectFrom("reflection")
    .select(["id", "logId", "feeling", "nextTimePlan", "timestamp"])
    .where("isDeleted", "is not", sqliteTrue)
);

const archivesQuery = evolu.createQuery((db) =>
  db
    .selectFrom("journeyArchive")
    .select(["id", "archivedAt"])
    .where("isDeleted", "is not", sqliteTrue)
);

/**
 * Hook that automatically checks and unlocks achievements based on user progress.
 *
 * This hook monitors various data sources and unlocks achievements when
 * their conditions are met. It runs checks on mount and whenever
 * relevant data changes.
 *
 * Achievement conditions:
 * - patient_one: Waited 10+ min past timer 5 times
 * - master_of_delay: Average wait time >= 10 min (from at least 5 events)
 * - craving_crusher: Used craving support 10 times
 * - daily_tracker: Logged every pouch for 7 consecutive days
 * - honest_logger: Logged an over-limit day with reflection
 * - pattern_spotter: Has a clear top trigger (>10 total logs, >30% from one trigger)
 * - phase_pioneer: Completed Phase 1 (currentPhase > 1)
 * - strength_shift: Using lower strength than baseline
 * - halfway_hero: Reached Phase 3 (currentPhase >= 3)
 * - zero_day: Had a day with only 0mg pouches
 * - freedom_week: 7 consecutive days nicotine-free
 * - mindful_moment: Completed 10 reflections
 * - self_compassion: Acknowledged a hard day with feeling reflection
 */
export function useAchievementAutoUnlock() {
  const settings = useUserSettings();
  const phases = useTaperingPhases();
  const { isUnlocked, unlock } = useAchievementsManager();

  // Get metric events for craving support and timer waits
  const metricEvents = useMetricEvents();

  // Get all pouch logs
  const allLogs = useQuery(allLogsQuery);

  // Get all reflections
  const reflections = useQuery(reflectionsQuery);

  // Get journey archives (for growth_mindset)
  const archives = useQuery(archivesQuery);

  // Memoized calculations
  const achievementData = useMemo(() => {
    if (!settings) return null;

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

    // Get set of reflection log IDs
    const reflectionLogIds = new Set(reflections.map((r) => r.logId));

    // =========================================
    // Waiting achievements from metric events
    // =========================================
    const cravingSupportEvents = metricEvents.filter(
      (e) => e.eventType === "craving_support_use"
    );
    const timerWaitEvents = metricEvents.filter(
      (e) => e.eventType === "timer_wait"
    );

    // craving_crusher: Used craving support 10 times
    const hasCravingCrusher = cravingSupportEvents.length >= 10;

    // patient_one: Waited 10+ min (600 sec) past timer 5 times
    const longWaits = timerWaitEvents.filter(
      (e) => e.value !== null && e.value >= 600
    );
    const hasPatientOne = longWaits.length >= 5;

    // master_of_delay: Average wait time >= 10 min (from at least 5 events)
    const waitValues = timerWaitEvents
      .filter((e) => e.value !== null)
      .map((e) => e.value as number);
    const avgWaitTime =
      waitValues.length > 0
        ? waitValues.reduce((a, b) => a + b, 0) / waitValues.length
        : 0;
    const hasMasterOfDelay = waitValues.length >= 5 && avgWaitTime >= 600;

    // =========================================
    // daily_tracker: 7 consecutive days with logs
    // =========================================
    let consecutiveDays = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayLogs = logsByDate.get(dateStr);

      if (dayLogs && dayLogs.length > 0) {
        consecutiveDays++;
      } else if (i > 0) {
        // Don't break on today if no logs yet
        break;
      }
    }
    const hasDaily7 = consecutiveDays >= 7;

    // =========================================
    // honest_logger: Over-limit log with reflection
    // =========================================
    const hasHonestLog = allLogs.some(
      (log) => log.isOverLimit && reflectionLogIds.has(log.id)
    );

    // =========================================
    // pattern_spotter: Clear top trigger (>10 logs, >30% from one)
    // =========================================
    const triggerCounts: Record<string, number> = {};
    let totalWithTrigger = 0;
    for (const log of allLogs) {
      if (log.trigger && log.trigger !== "none") {
        triggerCounts[log.trigger] = (triggerCounts[log.trigger] || 0) + 1;
        totalWithTrigger++;
      }
    }
    const topTriggerCount = Math.max(...Object.values(triggerCounts), 0);
    const hasPatternSpotter =
      totalWithTrigger >= 10 && topTriggerCount / totalWithTrigger >= 0.3;

    // =========================================
    // phase_pioneer: Completed Phase 1
    // =========================================
    const hasPhasePioneer = (settings.currentPhase ?? 1) > 1;

    // =========================================
    // strength_shift: Using lower strength than baseline
    // =========================================
    const currentPhase = phases.find(
      (p) => p.phaseNumber === settings.currentPhase
    );
    const hasStrengthShift =
      currentPhase &&
      currentPhase.strengthMg !== null &&
      settings.baselineStrengthMg
        ? currentPhase.strengthMg < settings.baselineStrengthMg
        : false;

    // =========================================
    // halfway_hero: Reached Phase 3
    // =========================================
    const hasHalfwayHero = (settings.currentPhase ?? 1) >= 3;

    // =========================================
    // zero_day: A day with only 0mg pouches (and at least 1 log)
    // =========================================
    let hasZeroDay = false;
    for (const [, dayLogs] of logsByDate) {
      if (dayLogs.length > 0 && dayLogs.every((log) => log.strengthMg === 0)) {
        hasZeroDay = true;
        break;
      }
    }

    // =========================================
    // freedom_week: 7 consecutive nicotine-free days
    // =========================================
    // IMPORTANT: A day is only "nicotine-free" if user has logged 0mg pouches.
    // Days with NO logs are "unknown" (user might not have tracked) and break the streak.
    // This prevents new users from getting this achievement before they've actually tracked anything.
    let zeroMgStreak = 0;
    let maxZeroMgStreak = 0;
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayLogs = logsByDate.get(dateStr);

      // A day is nicotine-free ONLY if there are logs AND all logs are 0mg
      // Days with no logs are "unknown" and break the streak
      const isNicotineFree =
        dayLogs &&
        dayLogs.length > 0 &&
        dayLogs.every((log) => log.strengthMg === 0);

      if (isNicotineFree) {
        zeroMgStreak++;
        maxZeroMgStreak = Math.max(maxZeroMgStreak, zeroMgStreak);
      } else {
        zeroMgStreak = 0;
      }
    }
    const hasFreedomWeek = maxZeroMgStreak >= 7;

    // =========================================
    // mindful_moment: 10 reflections completed
    // =========================================
    const hasMindfulMoment = reflections.length >= 10;

    // =========================================
    // self_compassion: Reflection with feeling
    // =========================================
    const hasSelfCompassion = reflections.some(
      (r) => r.feeling && r.feeling.length > 0
    );

    // =========================================
    // growth_mindset: Has restarted journey
    // =========================================
    const hasGrowthMindset = archives.length > 0;

    return {
      // Waiting achievements
      hasPatientOne,
      hasMasterOfDelay,
      hasCravingCrusher,
      // Consistency achievements
      hasDaily7,
      hasHonestLog,
      hasPatternSpotter,
      // Milestone achievements
      hasPhasePioneer,
      hasStrengthShift,
      hasHalfwayHero,
      hasZeroDay,
      hasFreedomWeek,
      // Reflection achievements
      hasMindfulMoment,
      hasSelfCompassion,
      hasGrowthMindset,
    };
  }, [settings, phases, allLogs, reflections, archives, metricEvents]);

  // Achievement check function
  const checkAndUnlockAchievements = useCallback(() => {
    if (!achievementData) return;

    const {
      // Waiting achievements
      hasPatientOne,
      hasMasterOfDelay,
      hasCravingCrusher,
      // Consistency achievements
      hasDaily7,
      hasHonestLog,
      hasPatternSpotter,
      // Milestone achievements
      hasPhasePioneer,
      hasStrengthShift,
      hasHalfwayHero,
      hasZeroDay,
      hasFreedomWeek,
      // Reflection achievements
      hasMindfulMoment,
      hasSelfCompassion,
      hasGrowthMindset,
    } = achievementData;

    // Waiting achievements
    if (hasPatientOne && !isUnlocked("patient_one")) {
      unlock("patient_one");
    }
    if (hasMasterOfDelay && !isUnlocked("master_of_delay")) {
      unlock("master_of_delay");
    }
    if (hasCravingCrusher && !isUnlocked("craving_crusher")) {
      unlock("craving_crusher");
    }

    // Consistency achievements
    if (hasDaily7 && !isUnlocked("daily_tracker")) {
      unlock("daily_tracker");
    }
    if (hasHonestLog && !isUnlocked("honest_logger")) {
      unlock("honest_logger");
    }
    if (hasPatternSpotter && !isUnlocked("pattern_spotter")) {
      unlock("pattern_spotter");
    }

    // Milestone achievements
    if (hasPhasePioneer && !isUnlocked("phase_pioneer")) {
      unlock("phase_pioneer");
    }
    if (hasStrengthShift && !isUnlocked("strength_shift")) {
      unlock("strength_shift");
    }
    if (hasHalfwayHero && !isUnlocked("halfway_hero")) {
      unlock("halfway_hero");
    }
    if (hasZeroDay && !isUnlocked("zero_day")) {
      unlock("zero_day");
    }
    if (hasFreedomWeek && !isUnlocked("freedom_week")) {
      unlock("freedom_week");
    }

    // Reflection achievements
    if (hasMindfulMoment && !isUnlocked("mindful_moment")) {
      unlock("mindful_moment");
    }
    if (hasSelfCompassion && !isUnlocked("self_compassion")) {
      unlock("self_compassion");
    }
    if (hasGrowthMindset && !isUnlocked("growth_mindset")) {
      unlock("growth_mindset");
    }
  }, [achievementData, isUnlocked, unlock]);

  // Run check on data changes
  useEffect(() => {
    checkAndUnlockAchievements();
  }, [checkAndUnlockAchievements]);

  return { checkAndUnlockAchievements };
}
