"use client";

import { useEffect, useCallback } from "react";
import {
  NonEmptyString1000,
  String as EvoluString,
  dateToDateIso,
  sqliteTrue,
  sqliteFalse,
} from "@evolu/common";
import { useEvolu, evolu } from "./evolu/schema";
import type {
  TriggerType,
  MetricEventType,
  AchievementId,
} from "./evolu/schema";

// Only run in development
const isDev = process.env.NODE_ENV === "development";

// Type declarations for window
declare global {
  interface Window {
    __DEV_TOOLS__?: DevTools;
  }
}

interface DevTools {
  // Achievement simulations
  simulatePatientOne: () => void;
  simulateMasterOfDelay: () => void;
  simulateCravingCrusher: () => void;
  simulateDailyTracker: () => void;
  simulateHonestLogger: () => void;
  simulatePatternSpotter: () => void;
  simulatePhasePioneer: () => void;
  simulateStrengthShift: () => void;
  simulateHalfwayHero: () => void;
  simulateZeroDay: () => void;
  simulateFreedomWeek: () => void;
  simulateMindfulMoment: () => void;
  simulateGrowthMindset: () => void;
  simulateSelfCompassion: () => void;

  // Utilities
  simulateAll: () => void;
  resetAchievements: () => Promise<void>;
  listUnlocked: () => Promise<void>;
  help: () => void;
}

// Helper functions
const toDateIso = (date: Date) => {
  const result = dateToDateIso(date);
  if (!result.ok) throw new Error(`Invalid date: ${date.toISOString()}`);
  return result.value;
};

const toEvoluString = (value: string) => {
  const result = EvoluString.from(value);
  if (!result.ok) throw new Error(`Invalid string: ${value}`);
  return result.value;
};

const toNonEmptyString1000 = (value: string) => {
  const result = NonEmptyString1000.from(value);
  if (!result.ok) throw new Error(`Invalid non-empty string: ${value}`);
  return result.value;
};

// Generate date N days ago at a specific hour
const daysAgo = (days: number, hour = 12): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

/**
 * Hook to set up development tools on window object.
 * Call this in a top-level component (like Providers) during development.
 */
export function useDevTools() {
  const { insert, update } = useEvolu();

  // Log metric event helper
  const logMetricEvent = useCallback(
    (eventType: MetricEventType, value?: number, timestamp?: Date) => {
      insert("metricEvent", {
        eventType: toEvoluString(eventType),
        timestamp: toDateIso(timestamp ?? new Date()),
        value: value ?? null,
      });
    },
    [insert]
  );

  // Log pouch helper
  const logPouch = useCallback(
    (
      strengthMg: number,
      trigger?: TriggerType,
      isOverLimit?: boolean,
      timestamp?: Date
    ) => {
      const result = insert("pouchLog", {
        timestamp: toDateIso(timestamp ?? new Date()),
        strengthMg,
        trigger: trigger ? toEvoluString(trigger) : null,
        isBackfill: timestamp ? sqliteTrue : sqliteFalse,
        isOverLimit: isOverLimit ? sqliteTrue : sqliteFalse,
      });
      return result.ok ? result.value.id : null;
    },
    [insert]
  );

  // Create reflection helper
  const createReflection = useCallback(
    (logId: string, feeling?: string, nextTimePlan?: string) => {
      insert("reflection", {
        logId: logId as unknown as ReturnType<
          typeof insert<"reflection">
        > extends { ok: true; value: { logId: infer T } }
          ? T
          : never,
        feeling: feeling ? toNonEmptyString1000(feeling) : null,
        nextTimePlan: nextTimePlan ? toNonEmptyString1000(nextTimePlan) : null,
        timestamp: toDateIso(new Date()),
      });
    },
    [insert]
  );

  useEffect(() => {
    if (!isDev) return;

    const devTools: DevTools = {
      // ===== WAITING ACHIEVEMENTS =====

      simulatePatientOne: () => {
        console.log("🎯 Simulating patient_one: 5 timer waits of 10+ minutes");
        for (let i = 0; i < 5; i++) {
          logMetricEvent("timer_wait", 700 + i * 60, daysAgo(i));
        }
        console.log("✅ Added 5 timer_wait events with value >= 600 seconds");
      },

      simulateMasterOfDelay: () => {
        console.log(
          "🎯 Simulating master_of_delay: Average wait time >= 600s with 5+ events"
        );
        for (let i = 0; i < 6; i++) {
          logMetricEvent("timer_wait", 650 + i * 20, daysAgo(i));
        }
        console.log("✅ Added 6 timer_wait events with average >= 600 seconds");
      },

      simulateCravingCrusher: () => {
        console.log("🎯 Simulating craving_crusher: 10 craving support uses");
        for (let i = 0; i < 10; i++) {
          logMetricEvent("craving_support_use", undefined, daysAgo(i));
        }
        console.log("✅ Added 10 craving_support_use events");
      },

      // ===== CONSISTENCY ACHIEVEMENTS =====

      simulateDailyTracker: () => {
        console.log(
          "🎯 Simulating daily_tracker: 7 consecutive days of logging"
        );
        for (let i = 0; i < 7; i++) {
          logPouch(6, "habit", false, daysAgo(i, 9));
          logPouch(6, "stress", false, daysAgo(i, 14));
        }
        console.log("✅ Added pouch logs for 7 consecutive days (2 per day)");
      },

      simulateHonestLogger: () => {
        console.log(
          "🎯 Simulating honest_logger: Over-limit log with reflection"
        );
        const logId = logPouch(8, "stress", true, daysAgo(1));
        if (logId) {
          createReflection(
            logId,
            "I was feeling stressed after a tough meeting",
            "Take a walk instead next time"
          );
          console.log("✅ Added over-limit log with reflection");
        } else {
          console.error("❌ Failed to create pouch log");
        }
      },

      simulatePatternSpotter: () => {
        console.log(
          "🎯 Simulating pattern_spotter: 11+ logs with >30% same trigger"
        );
        // Add 5 stress triggers (will be ~45% of total)
        for (let i = 0; i < 5; i++) {
          logPouch(6, "stress", false, daysAgo(i, 10));
        }
        // Add 6 other triggers
        const otherTriggers: TriggerType[] = [
          "habit",
          "social",
          "after_meal",
          "boredom",
          "craving",
          "none",
        ];
        for (let i = 0; i < 6; i++) {
          logPouch(6, otherTriggers[i], false, daysAgo(i, 16));
        }
        console.log(
          "✅ Added 11 pouch logs with stress being the dominant trigger (45%)"
        );
      },

      // ===== MILESTONE ACHIEVEMENTS =====

      simulatePhasePioneer: () => {
        console.log("🎯 Simulating phase_pioneer: Set currentPhase to 2");
        // Query for user settings and update
        const query = evolu.createQuery((db) =>
          db
            .selectFrom("userSettings")
            .select(["id"])
            .where("isDeleted", "is not", sqliteTrue)
            .limit(1)
        );
        evolu.loadQuery(query).then((rows) => {
          const settings = rows[0];
          if (settings) {
            update("userSettings", { id: settings.id, currentPhase: 2 });
            console.log("✅ Updated currentPhase to 2");
          } else {
            console.error(
              "❌ No user settings found. Complete onboarding first."
            );
          }
        });
      },

      simulateStrengthShift: () => {
        console.log(
          "🎯 Simulating strength_shift: Lower strength than baseline"
        );
        // First check/update user settings baseline
        const settingsQuery = evolu.createQuery((db) =>
          db
            .selectFrom("userSettings")
            .select(["id", "baselineStrengthMg"])
            .where("isDeleted", "is not", sqliteTrue)
            .limit(1)
        );
        evolu.loadQuery(settingsQuery).then((rows) => {
          const settings = rows[0];
          if (settings) {
            // Ensure baseline is set
            if (!settings.baselineStrengthMg) {
              update("userSettings", {
                id: settings.id,
                baselineStrengthMg: 12,
              });
            }
            // Create a tapering phase with lower strength
            insert("taperingPhase", {
              phaseNumber: 2,
              weekStart: 3,
              weekEnd: 4,
              dailyLimit: 8,
              strengthMg: 6, // Lower than typical baseline of 12
              isExtended: sqliteFalse,
            });
            console.log(
              "✅ Created tapering phase with strength 6mg (lower than baseline)"
            );
          } else {
            console.error(
              "❌ No user settings found. Complete onboarding first."
            );
          }
        });
      },

      simulateHalfwayHero: () => {
        console.log("🎯 Simulating halfway_hero: Set currentPhase to 3");
        const query = evolu.createQuery((db) =>
          db
            .selectFrom("userSettings")
            .select(["id"])
            .where("isDeleted", "is not", sqliteTrue)
            .limit(1)
        );
        evolu.loadQuery(query).then((rows) => {
          const settings = rows[0];
          if (settings) {
            update("userSettings", { id: settings.id, currentPhase: 3 });
            console.log("✅ Updated currentPhase to 3");
          } else {
            console.error(
              "❌ No user settings found. Complete onboarding first."
            );
          }
        });
      },

      simulateZeroDay: () => {
        console.log("🎯 Simulating zero_day: One day with all 0mg logs");
        const targetDay = daysAgo(1);
        for (let i = 0; i < 4; i++) {
          const timestamp = new Date(targetDay);
          timestamp.setHours(8 + i * 3);
          logPouch(0, "habit", false, timestamp);
        }
        console.log("✅ Added 4 pouch logs with 0mg strength for yesterday");
      },

      simulateFreedomWeek: () => {
        console.log("🎯 Simulating freedom_week: 7 consecutive 0mg days");
        for (let day = 1; day <= 7; day++) {
          for (let pouch = 0; pouch < 3; pouch++) {
            const timestamp = daysAgo(day, 8 + pouch * 4);
            logPouch(0, "habit", false, timestamp);
          }
        }
        console.log("✅ Added 0mg pouch logs for the last 7 days (3 per day)");
      },

      // ===== REFLECTION ACHIEVEMENTS =====

      simulateMindfulMoment: () => {
        console.log("🎯 Simulating mindful_moment: 10 reflections");
        for (let i = 0; i < 10; i++) {
          const logId = logPouch(6, "stress", true, daysAgo(i + 1));
          if (logId) {
            createReflection(
              logId,
              `Reflection ${i + 1}: Understanding my patterns`,
              "Be more mindful next time"
            );
          }
        }
        console.log("✅ Added 10 reflections");
      },

      simulateGrowthMindset: () => {
        console.log("🎯 Simulating growth_mindset: Archive a journey");
        insert("journeyArchive", {
          archivedAt: toDateIso(daysAgo(30)),
          finalPhase: 3,
          totalDays: 45,
          dataSnapshot: toNonEmptyString1000(
            JSON.stringify({ reason: "Fresh start for testing" })
          ),
        });
        console.log("✅ Created journey archive (simulating a restart)");
      },

      simulateSelfCompassion: () => {
        console.log("🎯 Simulating self_compassion: Reflection with feeling");
        const logId = logPouch(8, "stress", true, daysAgo(1, 20));
        if (logId) {
          createReflection(
            logId,
            "It was a tough day, but I'm being kind to myself about it. Progress isn't linear.",
            "Remember that setbacks are part of the journey"
          );
          console.log("✅ Added reflection with compassionate feeling");
        }
      },

      // ===== UTILITIES =====

      simulateAll: () => {
        console.log("🚀 Simulating ALL achievements...\n");
        devTools.simulatePatientOne();
        devTools.simulateMasterOfDelay();
        devTools.simulateCravingCrusher();
        devTools.simulateDailyTracker();
        devTools.simulateHonestLogger();
        devTools.simulatePatternSpotter();
        devTools.simulatePhasePioneer();
        devTools.simulateStrengthShift();
        devTools.simulateHalfwayHero();
        devTools.simulateZeroDay();
        devTools.simulateFreedomWeek();
        devTools.simulateMindfulMoment();
        devTools.simulateGrowthMindset();
        devTools.simulateSelfCompassion();
        console.log("\n✨ All achievement conditions simulated!");
        console.log(
          "Achievements should unlock automatically as the app detects the data changes."
        );
      },

      resetAchievements: async () => {
        console.log("🗑️ Resetting all achievements...");
        const query = evolu.createQuery((db) =>
          db
            .selectFrom("achievement")
            .select(["id"])
            .where("isDeleted", "is not", sqliteTrue)
        );
        const rows = await evolu.loadQuery(query);
        for (const achievement of rows) {
          update("achievement", {
            id: achievement.id as AchievementId,
            isDeleted: sqliteTrue,
          });
        }
        console.log(`✅ Soft-deleted ${rows.length} achievements`);
      },

      listUnlocked: async () => {
        console.log("📋 Currently unlocked achievements:\n");
        const query = evolu.createQuery((db) =>
          db
            .selectFrom("achievement")
            .select(["achievementType", "unlockedAt", "seen"])
            .where("isDeleted", "is not", sqliteTrue)
            .orderBy("unlockedAt", "desc")
        );
        const rows = await evolu.loadQuery(query);
        if (rows.length === 0) {
          console.log("No achievements unlocked yet.");
        } else {
          rows.forEach(
            (a: {
              achievementType: string | null;
              unlockedAt: string | null;
              seen: 0 | 1 | null;
            }) => {
              const seenStatus = a.seen ? "✓ seen" : "○ unseen";
              console.log(
                `  • ${a.achievementType} (${seenStatus}) - ${a.unlockedAt}`
              );
            }
          );
        }
        console.log(`\nTotal: ${rows.length} achievements`);
      },

      help: () => {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║             🧪 PouchFree Dev Tools                           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ACHIEVEMENT SIMULATIONS:                                    ║
║  ─────────────────────────────────────────────────────────── ║
║  __DEV_TOOLS__.simulatePatientOne()     - 5 timer waits     ║
║  __DEV_TOOLS__.simulateMasterOfDelay()  - Avg wait >= 600s  ║
║  __DEV_TOOLS__.simulateCravingCrusher() - 10 craving uses   ║
║  __DEV_TOOLS__.simulateDailyTracker()   - 7 days logging    ║
║  __DEV_TOOLS__.simulateHonestLogger()   - Over-limit + refl ║
║  __DEV_TOOLS__.simulatePatternSpotter() - Top trigger >30%  ║
║  __DEV_TOOLS__.simulatePhasePioneer()   - Phase 2           ║
║  __DEV_TOOLS__.simulateStrengthShift()  - Lower strength    ║
║  __DEV_TOOLS__.simulateHalfwayHero()    - Phase 3           ║
║  __DEV_TOOLS__.simulateZeroDay()        - 0mg day           ║
║  __DEV_TOOLS__.simulateFreedomWeek()    - 7 days 0mg        ║
║  __DEV_TOOLS__.simulateMindfulMoment()  - 10 reflections    ║
║  __DEV_TOOLS__.simulateGrowthMindset()  - Archive journey   ║
║  __DEV_TOOLS__.simulateSelfCompassion() - Feeling reflect   ║
║                                                              ║
║  UTILITIES:                                                  ║
║  ─────────────────────────────────────────────────────────── ║
║  __DEV_TOOLS__.simulateAll()       - Trigger all at once    ║
║  __DEV_TOOLS__.resetAchievements() - Clear all unlocked     ║
║  __DEV_TOOLS__.listUnlocked()      - Show unlocked list     ║
║  __DEV_TOOLS__.help()              - Show this help          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `);
      },
    };

    // Expose on window
    window.__DEV_TOOLS__ = devTools;
    console.log(
      "🧪 Dev tools loaded! Type __DEV_TOOLS__.help() for available commands."
    );

    return () => {
      delete window.__DEV_TOOLS__;
    };
  }, [insert, update, logMetricEvent, logPouch, createReflection]);
}
