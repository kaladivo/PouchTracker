"use client";

import { useState, useEffect } from "react";
import {
  createEvolu,
  id,
  InferType,
  NonEmptyString1000,
  nullOr,
  SqliteBoolean,
  DateIso,
  String,
  Number,
  sqliteTrue,
  NonEmptyString,
} from "@evolu/common";
import type { AppOwner } from "@evolu/common";
import { EvoluProvider, createUseEvolu, useQuery } from "@evolu/react";
import { evoluReactWebDeps } from "@evolu/react-web";

// Re-export sqliteTrue for queries
export { sqliteTrue };

/**
 * PouchFree Database Schema
 *
 * Local-first database using Evolu for offline support and E2E encrypted sync.
 * All data stays on device by default, with optional sync across devices.
 */

// ============================================
// ID Types
// ============================================

const UserSettingsId = id("UserSettings");
export type UserSettingsId = InferType<typeof UserSettingsId>;

const CustomStrengthId = id("CustomStrength");
export type CustomStrengthId = InferType<typeof CustomStrengthId>;

const TaperingPhaseId = id("TaperingPhase");
export type TaperingPhaseId = InferType<typeof TaperingPhaseId>;

const PouchLogId = id("PouchLog");
export type PouchLogId = InferType<typeof PouchLogId>;

const ReflectionId = id("Reflection");
export type ReflectionId = InferType<typeof ReflectionId>;

const AchievementId = id("Achievement");
export type AchievementId = InferType<typeof AchievementId>;

const JourneyArchiveId = id("JourneyArchive");
export type JourneyArchiveId = InferType<typeof JourneyArchiveId>;

const MetricEventId = id("MetricEvent");
export type MetricEventId = InferType<typeof MetricEventId>;

// ============================================
// Database Schema
// ============================================

/**
 * Schema definition using the new Evolu API.
 * Each table is defined as an object with column definitions.
 * Evolu automatically includes: id, createdAt, updatedAt, isDeleted, ownerId
 */
const Schema = {
  /**
   * User Settings - Core app configuration
   * Only one row expected (singleton pattern)
   */
  userSettings: {
    id: UserSettingsId,
    // Schedule - "HH:MM" format
    wakeTime: nullOr(String),
    sleepTime: nullOr(String),
    pouchIntervalMinutes: nullOr(Number),
    // Progress
    currentPhase: nullOr(Number),
    startDate: nullOr(DateIso),
    quitGoalDate: nullOr(DateIso),
    // Cost tracking
    currency: nullOr(String),
    pricePerCan: nullOr(Number), // in cents
    pouchesPerCan: nullOr(Number),
    // Baseline
    baselineDailyPouches: nullOr(Number),
    baselineStrengthMg: nullOr(Number),
    // Motivation
    personalWhy: nullOr(NonEmptyString),
    // Onboarding
    onboardingCompleted: nullOr(SqliteBoolean),
  },

  /**
   * Custom Strengths - User-defined or preset pouch strengths
   */
  customStrength: {
    id: CustomStrengthId,
    brandName: NonEmptyString1000,
    strengthMg: Number,
    isPreset: nullOr(SqliteBoolean),
  },

  /**
   * Tapering Phases - The user's tapering plan
   */
  taperingPhase: {
    id: TaperingPhaseId,
    phaseNumber: Number, // 1-5
    weekStart: Number,
    weekEnd: Number,
    dailyLimit: Number,
    strengthMg: Number,
    isExtended: nullOr(SqliteBoolean),
    extendedUntil: nullOr(DateIso),
  },

  /**
   * Pouch Logs - Individual pouch usage records
   */
  pouchLog: {
    id: PouchLogId,
    timestamp: DateIso,
    strengthMg: Number,
    trigger: nullOr(String), // "stress" | "habit" | etc
    isBackfill: nullOr(SqliteBoolean),
    isOverLimit: nullOr(SqliteBoolean),
  },

  /**
   * Reflections - User reflections when exceeding limits
   */
  reflection: {
    id: ReflectionId,
    logId: PouchLogId,
    feeling: nullOr(NonEmptyString1000),
    nextTimePlan: nullOr(NonEmptyString1000),
    timestamp: DateIso,
  },

  /**
   * Achievements - Unlocked achievements
   */
  achievement: {
    id: AchievementId,
    achievementType: String,
    unlockedAt: DateIso,
    seen: nullOr(SqliteBoolean),
  },

  /**
   * Journey Archives - Historical journey data
   */
  journeyArchive: {
    id: JourneyArchiveId,
    archivedAt: DateIso,
    finalPhase: Number,
    totalDays: Number,
    dataSnapshot: nullOr(NonEmptyString1000),
  },

  /**
   * Metric Events - Track various user interactions for achievements
   * Used for: craving support usage, timer waits, etc.
   */
  metricEvent: {
    id: MetricEventId,
    eventType: String, // "craving_support_use" | "timer_wait"
    timestamp: DateIso,
    value: nullOr(Number), // For timer_wait: seconds waited past timer
  },
};

// ============================================
// Evolu Instance
// ============================================

/**
 * Create the Evolu instance using the new modular API.
 * evoluReactWebDeps provides web-specific implementations.
 *
 * NOTE: This module uses "use client" and components using Evolu should be
 * dynamically imported with { ssr: false } to avoid SSR issues.
 */
export const evolu = createEvolu(evoluReactWebDeps)(Schema, {
  transports: [
    ...(process.env.NODE_ENV !== "development"
      ? [
          {
            type: "WebSocket" as const,
            url: "wss://evolu.davenov.com",
          },
        ]
      : []),
  ],
});

// Database type matches our Schema definition
export type Database = typeof Schema;

// ============================================
// Hooks
// ============================================

/**
 * Hook to access the Evolu instance with full type inference.
 */
export const useEvolu = createUseEvolu(evolu);

/**
 * Re-export useQuery for convenience.
 * Usage: const rows = useQuery(evolu.createQuery((db) => db.selectFrom("table")...));
 * Note: useQuery returns an array directly, not { rows, row }
 */
export { useQuery };

/**
 * Re-export EvoluProvider for app wrapping.
 */
export { EvoluProvider };

/**
 * Hook to get the app owner (for displaying owner ID in settings).
 * Returns null while loading.
 */
export function useAppOwner(): AppOwner | null {
  const [owner, setOwner] = useState<AppOwner | null>(null);

  useEffect(() => {
    evolu.appOwner.then(setOwner);
  }, []);

  return owner;
}

// ============================================
// Type Helpers
// ============================================

export type TriggerType =
  | "stress"
  | "habit"
  | "social"
  | "after_meal"
  | "boredom"
  | "craving"
  | "other"
  | "none";

export type AchievementType =
  | "patient_one"
  | "master_of_delay"
  | "craving_crusher"
  | "daily_tracker"
  | "honest_logger"
  | "pattern_spotter"
  | "phase_pioneer"
  | "strength_shift"
  | "halfway_hero"
  | "zero_day"
  | "freedom_week"
  | "mindful_moment"
  | "growth_mindset"
  | "self_compassion";

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "CZK"
  | "PLN"
  | "SEK"
  | "NOK"
  | "DKK";

export type MetricEventType = "craving_support_use" | "timer_wait";
