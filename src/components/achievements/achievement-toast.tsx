"use client";

import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Achievement } from "@/lib/achievements";
import { Sparkles } from "lucide-react";

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementToast({
  achievement,
  onDismiss,
}: AchievementToastProps) {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!achievement) return;
    const timeout = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timeout);
  }, [achievement, onDismiss]);

  return (
    <Sheet open={!!achievement} onOpenChange={() => onDismiss()}>
      <SheetContent side="top" className="rounded-b-3xl">
        <SheetHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <div className="relative">
              <div className="bg-primary/10 animate-bounce-once flex h-20 w-20 items-center justify-center rounded-full text-4xl">
                {achievement?.emoji}
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="text-warning h-6 w-6 animate-pulse" />
              </div>
            </div>
          </div>
          <SheetTitle className="text-xl">Achievement Unlocked!</SheetTitle>
          <SheetDescription className="text-base">
            <span className="text-foreground block font-medium">
              {achievement?.name}
            </span>
            {achievement?.description}
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <Button className="w-full" onClick={onDismiss}>
            Awesome!
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
