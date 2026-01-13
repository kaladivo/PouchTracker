"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BottomNav } from "./bottom-nav";
import { AchievementToast } from "@/components/achievements";
import { useAchievementAutoUnlock } from "@/hooks/use-achievement-auto-unlock";
import { useAchievementsManager } from "@/hooks/use-achievements";
import { getAchievement, type Achievement } from "@/lib/achievements";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Achievement auto-unlock (runs checks on data changes)
  useAchievementAutoUnlock();

  // Achievement toast state
  const [currentToast, setCurrentToast] = useState<Achievement | null>(null);
  const { unseenAchievements, markSeen } = useAchievementsManager();
  const processedIds = useRef(new Set<string>());

  // Show toast for newly unlocked achievements
  useEffect(() => {
    // Find the first unseen achievement we haven't already processed
    const unprocessedAchievement = unseenAchievements.find(
      (a) => !processedIds.current.has(a.id)
    );

    if (unprocessedAchievement && !currentToast) {
      const achievement = getAchievement(unprocessedAchievement.id);
      if (achievement) {
        processedIds.current.add(unprocessedAchievement.id);
        setCurrentToast(achievement);
      }
    }
  }, [unseenAchievements, currentToast]);

  // Handle toast dismiss
  const handleToastDismiss = useCallback(() => {
    if (currentToast) {
      // Find the unseen achievement row to mark as seen
      const unseenRow = unseenAchievements.find(
        (a) => a.id === currentToast.id
      );
      if (unseenRow) {
        markSeen(unseenRow.dbId);
      }
    }
    setCurrentToast(null);
  }, [currentToast, unseenAchievements, markSeen]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Main content area - accounts for bottom nav height */}
      <main className="safe-area-top flex-1 pb-20">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav />

      {/* Achievement unlock toast */}
      <AchievementToast
        achievement={currentToast}
        onDismiss={handleToastDismiss}
      />
    </div>
  );
}
