"use client";

import {
  NonEmptyString1000,
  String as EvoluString,
  dateToDateIso,
  sqliteTrue,
  sqliteFalse,
} from "@evolu/common";
import { useQuery, evolu, useEvolu } from "./schema";
import type {
  TriggerType,
  MetricEventType,
  UserSettingsId,
  TaperingPhaseId,
  PouchLogId,
  ReflectionId,
  AchievementId,
  MetricEventId,
} from "./schema";

// ============================================
// Query Definitions
// ============================================

const userSettingsQuery = evolu.createQuery((db) =>
  db
    .selectFrom("userSettings")
    .select([
      "id",
      "wakeTime",
      "sleepTime",
      "pouchIntervalMinutes",
      "currentPhase",
      "startDate",
      "currency",
      "pricePerCan",
      "pouchesPerCan",
      "baselineDailyPouches",
      "baselineStrengthMg",
      "personalWhy",
      "onboardingCompleted",
      "isDeleted",
    ])
    .where("isDeleted", "is not", sqliteTrue)
    .limit(1)
);

const pouchLogsQuery = evolu.createQuery((db) =>
  db
    .selectFrom("pouchLog")
    .select(["id", "timestamp", "strengthMg", "trigger", "isOverLimit"])
    .where("isDeleted", "is not", sqliteTrue)
    .orderBy("timestamp", "desc")
);

const taperingPhasesQuery = evolu.createQuery((db) =>
  db
    .selectFrom("taperingPhase")
    .select([
      "id",
      "phaseNumber",
      "dailyLimit",
      "strengthMg",
      "weekStart",
      "weekEnd",
      "isExtended",
    ])
    .where("isDeleted", "is not", sqliteTrue)
    .orderBy("phaseNumber", "asc")
);

const achievementsQuery = evolu.createQuery((db) =>
  db
    .selectFrom("achievement")
    .select(["id", "achievementType", "unlockedAt", "seen"])
    .where("isDeleted", "is not", sqliteTrue)
    .orderBy("unlockedAt", "desc")
);

const metricEventsQuery = evolu.createQuery((db) =>
  db
    .selectFrom("metricEvent")
    .select(["id", "eventType", "timestamp", "value"])
    .where("isDeleted", "is not", sqliteTrue)
    .orderBy("timestamp", "desc")
);

const journeyArchivesQuery = evolu.createQuery((db) =>
  db
    .selectFrom("journeyArchive")
    .select(["id", "archivedAt", "finalPhase", "totalDays", "dataSnapshot"])
    .where("isDeleted", "is not", sqliteTrue)
    .orderBy("archivedAt", "desc")
);

const allPouchLogsQuery = evolu.createQuery((db) =>
  db
    .selectFrom("pouchLog")
    .select([
      "id",
      "timestamp",
      "strengthMg",
      "trigger",
      "isBackfill",
      "isOverLimit",
    ])
    .where("isDeleted", "is not", sqliteTrue)
    .orderBy("timestamp", "desc")
);

const allReflectionsQuery = evolu.createQuery((db) =>
  db
    .selectFrom("reflection")
    .select(["id", "logId", "feeling", "nextTimePlan", "timestamp"])
    .where("isDeleted", "is not", sqliteTrue)
    .orderBy("timestamp", "desc")
);

// ============================================
// Helper Functions
// ============================================

/** Convert a Date to DateIso, throwing on error */
const toDateIso = (date: Date) => {
  const result = dateToDateIso(date);
  if (!result.ok) {
    throw new Error(`Invalid date: ${date.toISOString()}`);
  }
  return result.value;
};

/** Convert a string to EvoluString */
const toEvoluString = (value: string) => {
  const result = EvoluString.from(value);
  if (!result.ok) {
    throw new Error(`Invalid string: ${value}`);
  }
  return result.value;
};

/** Convert a string to NonEmptyString1000 */
const toNonEmptyString1000 = (value: string) => {
  const result = NonEmptyString1000.from(value);
  if (!result.ok) {
    throw new Error(`Invalid non-empty string: ${value}`);
  }
  return result.value;
};

// ============================================
// Hooks
// ============================================

/**
 * Hook to get user settings (singleton)
 */
export function useUserSettings() {
  const rows = useQuery(userSettingsQuery);
  return rows[0] ?? null;
}

/**
 * Hook to get today's pouch logs
 */
export function useTodayLogs() {
  const rows = useQuery(pouchLogsQuery);

  // Filter client-side to get today's logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return rows.filter((row) => {
    if (!row.timestamp) return false;
    const logDate = new Date(row.timestamp);
    return logDate >= today;
  });
}

/**
 * Hook to get all tapering phases
 */
export function useTaperingPhases() {
  const rows = useQuery(taperingPhasesQuery);
  return rows;
}

/**
 * Hook to get all achievements
 */
export function useAchievements() {
  const rows = useQuery(achievementsQuery);
  return rows;
}

/**
 * Hook to get metric events (for achievement tracking)
 */
export function useMetricEvents() {
  const rows = useQuery(metricEventsQuery);
  return rows;
}

/**
 * Hook to get all journey archives
 */
export function useJourneyArchives() {
  const rows = useQuery(journeyArchivesQuery);
  return rows;
}

/**
 * Hook to get all pouch logs (for archiving)
 */
export function useAllPouchLogs() {
  const rows = useQuery(allPouchLogsQuery);
  return rows;
}

/**
 * Hook to get all reflections (for archiving)
 */
export function useAllReflections() {
  const rows = useQuery(allReflectionsQuery);
  return rows;
}

/**
 * Hook for mutations
 */
export function usePouchTrackerMutation() {
  const { insert, update } = useEvolu();

  const createUserSettings = (data: {
    wakeTime: string;
    sleepTime: string;
    currency: string;
    pricePerCan: number | null;
    pouchesPerCan: number;
    baselineDailyPouches: number;
    baselineStrengthMg: number;
    personalWhy: string;
  }) => {
    // Calculate interval: 16 waking hours divided by pouches per day
    const intervalMinutes =
      data.baselineDailyPouches > 0
        ? Math.round((16 * 60) / data.baselineDailyPouches)
        : 120;

    insert("userSettings", {
      wakeTime: toEvoluString(data.wakeTime),
      sleepTime: toEvoluString(data.sleepTime),
      pouchIntervalMinutes: intervalMinutes,
      currentPhase: 1,
      startDate: toDateIso(new Date()),
      currency: toEvoluString(data.currency),
      pricePerCan: data.pricePerCan ? Math.round(data.pricePerCan * 100) : null,
      pouchesPerCan: data.pouchesPerCan,
      baselineDailyPouches: data.baselineDailyPouches,
      baselineStrengthMg: data.baselineStrengthMg,
      personalWhy: toNonEmptyString1000(data.personalWhy),
      onboardingCompleted: sqliteTrue,
    });
  };

  const createTaperingPhase = (data: {
    phaseNumber: number;
    weekStart: number;
    weekEnd: number;
    dailyLimit: number;
    strengthMg: number;
  }) => {
    insert("taperingPhase", {
      phaseNumber: data.phaseNumber,
      weekStart: data.weekStart,
      weekEnd: data.weekEnd,
      dailyLimit: data.dailyLimit,
      strengthMg: data.strengthMg,
      isExtended: sqliteFalse,
    });
  };

  const logPouch = (data: {
    strengthMg: number;
    trigger?: TriggerType;
    isOverLimit?: boolean;
    timestamp?: Date;
  }) => {
    const ts = data.timestamp ?? new Date();
    const result = insert("pouchLog", {
      timestamp: toDateIso(ts),
      strengthMg: data.strengthMg,
      trigger: data.trigger ? toEvoluString(data.trigger) : null,
      isBackfill: data.timestamp ? sqliteTrue : sqliteFalse,
      isOverLimit: data.isOverLimit ? sqliteTrue : sqliteFalse,
    });
    if (result.ok) {
      return result.value.id;
    }
    throw new Error("Failed to log pouch");
  };

  const updateSettings = (
    id: UserSettingsId,
    data: Partial<{
      currentPhase: number;
      pouchIntervalMinutes: number;
      wakeTime: string;
      sleepTime: string;
      pricePerCan: number | null;
      pouchesPerCan: number;
      currency: string;
      personalWhy: string | null;
      onboardingCompleted: boolean;
      baselineDailyPouches: number;
      baselineStrengthMg: number;
    }>
  ) => {
    update("userSettings", {
      id,
      ...(data.currentPhase !== undefined && {
        currentPhase: data.currentPhase,
      }),
      ...(data.pouchIntervalMinutes !== undefined && {
        pouchIntervalMinutes: data.pouchIntervalMinutes,
      }),
      ...(data.wakeTime !== undefined && {
        wakeTime: toEvoluString(data.wakeTime),
      }),
      ...(data.sleepTime !== undefined && {
        sleepTime: toEvoluString(data.sleepTime),
      }),
      ...(data.pricePerCan !== undefined && {
        pricePerCan: data.pricePerCan,
      }),
      ...(data.pouchesPerCan !== undefined && {
        pouchesPerCan: data.pouchesPerCan,
      }),
      ...(data.currency !== undefined && {
        currency: toEvoluString(data.currency),
      }),
      ...(data.personalWhy !== undefined && {
        personalWhy: data.personalWhy
          ? toNonEmptyString1000(data.personalWhy)
          : null,
      }),
      ...(data.onboardingCompleted !== undefined && {
        onboardingCompleted: data.onboardingCompleted
          ? sqliteTrue
          : sqliteFalse,
      }),
      ...(data.baselineDailyPouches !== undefined && {
        baselineDailyPouches: data.baselineDailyPouches,
      }),
      ...(data.baselineStrengthMg !== undefined && {
        baselineStrengthMg: data.baselineStrengthMg,
      }),
    });
  };

  const createReflection = (data: {
    logId: PouchLogId;
    feeling: string;
    nextTimePlan: string;
  }) => {
    insert("reflection", {
      logId: data.logId,
      feeling: data.feeling ? toNonEmptyString1000(data.feeling) : null,
      nextTimePlan: data.nextTimePlan
        ? toNonEmptyString1000(data.nextTimePlan)
        : null,
      timestamp: toDateIso(new Date()),
    });
  };

  const unlockAchievement = (achievementType: string) => {
    insert("achievement", {
      achievementType: toEvoluString(achievementType),
      unlockedAt: toDateIso(new Date()),
      seen: sqliteFalse,
    });
  };

  const markAchievementSeen = (id: AchievementId) => {
    update("achievement", { id, seen: sqliteTrue });
  };

  const logMetricEvent = (data: {
    eventType: MetricEventType;
    value?: number;
  }) => {
    insert("metricEvent", {
      eventType: toEvoluString(data.eventType),
      timestamp: toDateIso(new Date()),
      value: data.value ?? null,
    });
  };

  const extendPhase = (phaseId: TaperingPhaseId) => {
    update("taperingPhase", {
      id: phaseId,
      isExtended: sqliteTrue,
    });
  };

  const updatePhaseWeeks = (
    phaseId: TaperingPhaseId,
    data: { weekStart?: number; weekEnd?: number }
  ) => {
    update("taperingPhase", { id: phaseId, ...data });
  };

  const updatePhaseDetails = (
    phaseId: TaperingPhaseId,
    data: {
      dailyLimit?: number;
      strengthMg?: number;
      weekStart?: number;
      weekEnd?: number;
    }
  ) => {
    update("taperingPhase", { id: phaseId, ...data });
  };

  const createJourneyArchive = (data: {
    finalPhase: number;
    totalDays: number;
    dataSnapshot: string;
  }) => {
    insert("journeyArchive", {
      archivedAt: toDateIso(new Date()),
      finalPhase: data.finalPhase,
      totalDays: data.totalDays,
      dataSnapshot: data.dataSnapshot
        ? toNonEmptyString1000(data.dataSnapshot)
        : null,
    });
  };

  const softDeleteLog = (logId: PouchLogId) => {
    update("pouchLog", { id: logId, isDeleted: sqliteTrue });
  };

  const softDeleteReflection = (reflectionId: ReflectionId) => {
    update("reflection", {
      id: reflectionId,
      isDeleted: sqliteTrue,
    });
  };

  const softDeleteAchievement = (achievementId: AchievementId) => {
    update("achievement", {
      id: achievementId,
      isDeleted: sqliteTrue,
    });
  };

  const softDeleteMetricEvent = (metricEventId: MetricEventId) => {
    update("metricEvent", {
      id: metricEventId,
      isDeleted: sqliteTrue,
    });
  };

  return {
    createUserSettings,
    createTaperingPhase,
    logPouch,
    updateSettings,
    createReflection,
    unlockAchievement,
    markAchievementSeen,
    logMetricEvent,
    extendPhase,
    updatePhaseWeeks,
    updatePhaseDetails,
    createJourneyArchive,
    softDeleteLog,
    softDeleteReflection,
    softDeleteAchievement,
    softDeleteMetricEvent,
  };
}
