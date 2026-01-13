"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Achievement } from "@/lib/achievements";

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  unlockedAt?: string;
  size?: "sm" | "md";
}

export function AchievementCard({
  achievement,
  isUnlocked,
  unlockedAt,
  size = "md",
}: AchievementCardProps) {
  return (
    <Card
      className={`transition-all ${
        isUnlocked ? "bg-card" : "bg-muted/30 opacity-60"
      } ${size === "sm" ? "" : ""}`}
    >
      <CardContent className={`${size === "sm" ? "p-3" : "p-4"}`}>
        <div className="flex items-start gap-3">
          <div
            className={`flex items-center justify-center rounded-full ${
              size === "sm" ? "h-10 w-10 text-xl" : "h-12 w-12 text-2xl"
            } ${isUnlocked ? "bg-primary/10" : "bg-muted grayscale"}`}
          >
            {achievement.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-medium ${
                size === "sm" ? "text-sm" : ""
              } ${!isUnlocked ? "text-muted-foreground" : ""}`}
            >
              {achievement.name}
            </p>
            <p
              className={`text-muted-foreground line-clamp-2 ${
                size === "sm" ? "text-xs" : "text-sm"
              }`}
            >
              {achievement.description}
            </p>
            {isUnlocked && unlockedAt && (
              <p className="text-primary mt-1 text-xs">
                Unlocked {new Date(unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
