"use client";

import { useCallback, useMemo } from "react";
import {
  useAchievements as useAchievementsData,
  usePouchFreeMutation,
} from "@/lib/evolu/hooks";
import type { AchievementId as AchievementDbId } from "@/lib/evolu/schema";
import {
  achievements,
  type AchievementId,
  type Achievement,
  getAchievement,
} from "@/lib/achievements";

export interface UnlockedAchievement extends Achievement {
  dbId: AchievementDbId;
  unlockedAt: string;
  seen: boolean;
}

export function useAchievementsManager() {
  const achievementRows = useAchievementsData();
  const { unlockAchievement, markAchievementSeen } = usePouchFreeMutation();

  // Map database rows to achievement objects
  const unlockedAchievements = useMemo(() => {
    const results: UnlockedAchievement[] = [];
    for (const row of achievementRows) {
      const achievement = getAchievement(row.achievementType as AchievementId);
      if (achievement) {
        results.push({
          ...achievement,
          dbId: row.id,
          unlockedAt: row.unlockedAt ?? new Date().toISOString(),
          seen: !!row.seen,
        });
      }
    }
    return results;
  }, [achievementRows]);

  // Get unlocked achievement IDs for quick lookup
  const unlockedIds = useMemo(() => {
    return new Set(unlockedAchievements.map((a) => a.id));
  }, [unlockedAchievements]);

  // Check if an achievement is already unlocked
  const isUnlocked = useCallback(
    (id: AchievementId) => unlockedIds.has(id),
    [unlockedIds]
  );

  // Unlock an achievement if not already unlocked
  const unlock = useCallback(
    (id: AchievementId): boolean => {
      if (unlockedIds.has(id)) return false;
      unlockAchievement(id);
      return true;
    },
    [unlockedIds, unlockAchievement]
  );

  // Mark an achievement as seen
  const markSeen = useCallback(
    (achievementDbId: AchievementDbId) => {
      markAchievementSeen(achievementDbId);
    },
    [markAchievementSeen]
  );

  // Get unseen achievements for displaying notifications
  const unseenAchievements = useMemo(() => {
    return unlockedAchievements.filter((a) => !a.seen);
  }, [unlockedAchievements]);

  // Get all achievements with unlock status
  const allAchievements = useMemo(() => {
    return achievements.map((a) => ({
      ...a,
      isUnlocked: unlockedIds.has(a.id),
      unlockedAt: unlockedAchievements.find((u) => u.id === a.id)?.unlockedAt,
    }));
  }, [unlockedIds, unlockedAchievements]);

  return {
    unlockedAchievements,
    unseenAchievements,
    allAchievements,
    isUnlocked,
    unlock,
    markSeen,
    totalUnlocked: unlockedAchievements.length,
    totalAchievements: achievements.length,
  };
}
