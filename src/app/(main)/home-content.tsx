"use client";

import { Suspense, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuickLogSheet } from "@/components/logging";
import { CravingSupportModal } from "@/components/craving-support";
import { useTimer } from "@/hooks/use-timer";
import { useNicotineFreeProgress } from "@/hooks/use-nicotine-free-progress";
import {
  useUserSettings,
  useTodayLogs,
  useTaperingPhases,
  usePouchFreeMutation,
} from "@/lib/evolu/hooks";
import type { TriggerType, PouchLogId } from "@/lib/evolu/schema";
import { Moon, Heart, Sparkles, Trophy } from "lucide-react";
import { AUTO_INTERVAL_VALUE, calculateAutoInterval } from "@/lib/utils";

function HomeContentInner() {
  const settings = useUserSettings();
  const todayLogs = useTodayLogs();
  const phases = useTaperingPhases();
  const { logPouch, createReflection, logMetricEvent } = usePouchFreeMutation();
  const nicotineFreeProgress = useNicotineFreeProgress();

  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [cravingSupportOpen, setCravingSupportOpen] = useState(false);
  const lastLogIdRef = useRef<PouchLogId | null>(null);

  // Capture current time once on mount to avoid impure Date.now() in render
  const [now] = useState(() => Date.now());

  // Get current phase info
  const currentPhase = phases.find(
    (p) => p.phaseNumber === settings?.currentPhase
  );
  const dailyLimit =
    currentPhase?.dailyLimit ?? settings?.baselineDailyPouches ?? 10;
  const strengthMg =
    currentPhase?.strengthMg ?? settings?.baselineStrengthMg ?? 6;

  // Calculate today's usage
  const todayCount = todayLogs.length;
  const remaining = Math.max(0, dailyLimit - todayCount);
  const progressPercent = dailyLimit > 0 ? (todayCount / dailyLimit) * 100 : 0;

  // Get last pouch time
  const lastPouchTime =
    todayLogs.length > 0 && todayLogs[0].timestamp
      ? new Date(todayLogs[0].timestamp)
      : null;

  // Calculate effective interval (auto-calculated or manual)
  const wakeTime = settings?.wakeTime ?? "07:00";
  const sleepTime = settings?.sleepTime ?? "23:00";
  const effectiveInterval = useMemo(() => {
    const storedInterval = settings?.pouchIntervalMinutes;
    if (
      storedInterval === AUTO_INTERVAL_VALUE ||
      storedInterval === undefined ||
      storedInterval === null
    ) {
      // Auto mode: calculate based on waking hours and daily limit
      return calculateAutoInterval(wakeTime, sleepTime, dailyLimit);
    }
    return storedInterval;
  }, [settings?.pouchIntervalMinutes, wakeTime, sleepTime, dailyLimit]);

  // Timer - must be called unconditionally (React hooks rules)
  const timer = useTimer({
    lastPouchTime,
    intervalMinutes: effectiveInterval,
    wakeTime,
    sleepTime,
    dailyLimit,
    todayCount,
  });

  // Calculate money saved (simple estimate based on reduction)
  const moneySaved = useMemo(() => {
    if (
      !settings?.pricePerCan ||
      !settings?.pouchesPerCan ||
      !settings?.startDate
    ) {
      return null;
    }
    const pricePerPouch = settings.pricePerCan / 100 / settings.pouchesPerCan;
    const daysSinceStart = Math.floor(
      (now - new Date(settings.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const baseline = settings.baselineDailyPouches ?? 10;
    // Rough estimate: saved pouches = (baseline - current limit) * days
    const savedPouches = Math.max(0, (baseline - dailyLimit) * daysSinceStart);
    return (savedPouches * pricePerPouch).toFixed(0);
  }, [settings, dailyLimit, now]);

  // Calculate days since start (used in multiple places)
  const daysSinceStart = useMemo(() => {
    if (!settings?.startDate) return 0;
    return Math.floor(
      (now - new Date(settings.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [settings, now]);

  // Show loading while settings load (onboarding guard is handled at layout level)
  if (!settings) {
    return <HomeLoading />;
  }

  const handleLogPouch = (
    trigger: TriggerType | undefined,
    timestamp?: Date
  ) => {
    // Log timer wait metric if user waited past the timer (and not backfilling)
    if (!timestamp && timer.secondsWaitedPastTimer > 0) {
      logMetricEvent({
        eventType: "timer_wait",
        value: timer.secondsWaitedPastTimer,
      });
    }

    // Log the pouch and get the returned ID for linking reflections
    const logId = logPouch({
      strengthMg,
      trigger,
      isOverLimit: timestamp ? false : todayCount >= dailyLimit,
      timestamp,
    });
    lastLogIdRef.current = logId;
  };

  const handleReflection = (feeling: string, nextTimePlan: string) => {
    // Save reflection linked to the last logged pouch
    if (lastLogIdRef.current) {
      createReflection({
        logId: lastLogIdRef.current,
        feeling,
        nextTimePlan,
      });
      lastLogIdRef.current = null;
    }
  };

  const getCurrencySymbol = (code: string | null) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CZK: "Kč",
      SEK: "kr",
    };
    return symbols[code ?? "USD"] ?? "$";
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Timer Card - Main focus */}
      <Card className="relative overflow-hidden">
        <div className="from-primary/10 to-secondary/10 absolute inset-0 bg-gradient-to-br" />
        <CardHeader className="relative pb-2 text-center">
          {timer.state === "sleeping" ? (
            <>
              <div className="text-muted-foreground flex items-center justify-center gap-2">
                <Moon className="h-4 w-4" />
                <CardDescription>
                  Sleep mode · resumes at {settings.wakeTime}
                </CardDescription>
              </div>
              <CardTitle className="text-muted-foreground text-4xl font-light tracking-tight tabular-nums">
                {timer.formattedTime}
              </CardTitle>
            </>
          ) : timer.state === "available" ? (
            <>
              <CardDescription className="text-primary">Ready!</CardDescription>
              <CardTitle className="text-primary text-4xl font-light tracking-tight">
                Pouch available
              </CardTitle>
            </>
          ) : (
            <>
              <CardDescription>Next pouch available in</CardDescription>
              <CardTitle className="text-primary text-5xl font-light tracking-tight tabular-nums">
                {timer.formattedTime}
              </CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="relative space-y-3">
          <Button
            size="lg"
            className={`h-14 w-full text-lg ${
              timer.state === "available" ? "animate-gentle-pulse" : ""
            }`}
            onClick={() => setLogSheetOpen(true)}
          >
            Log a Pouch
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full"
            onClick={() => setCravingSupportOpen(true)}
          >
            <Heart className="text-primary mr-2 h-4 w-4" />
            Craving Support
          </Button>
        </CardContent>
      </Card>

      {/* Today's Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              Today&apos;s Progress
            </CardTitle>
            <span className="text-muted-foreground text-sm">
              {todayCount} / {dailyLimit} pouches
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress
            value={Math.min(progressPercent, 100)}
            className={`h-3 ${progressPercent > 100 ? "[&>div]:bg-destructive" : ""}`}
          />
          <p className="text-muted-foreground mt-2 text-center text-xs">
            {remaining > 0
              ? `${remaining} remaining for today`
              : "Daily limit reached"}
          </p>
        </CardContent>
      </Card>

      {/* Nicotine-Free Progress Card */}
      {(nicotineFreeProgress.isInNicotineFreePhase ||
        nicotineFreeProgress.consecutiveNicotineFreeDays > 0) && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-900 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                {nicotineFreeProgress.hasFreedomWeek ? (
                  <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-emerald-900 dark:text-emerald-100">
                  {nicotineFreeProgress.hasFreedomWeek
                    ? "Freedom Achieved!"
                    : nicotineFreeProgress.isInNicotineFreePhase
                      ? "Nicotine-Free Phase"
                      : "Nicotine-Free Streak"}
                </p>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  {nicotineFreeProgress.hasFreedomWeek
                    ? `${nicotineFreeProgress.consecutiveNicotineFreeDays} days nicotine-free!`
                    : `${nicotineFreeProgress.consecutiveNicotineFreeDays} of 7 days toward freedom week`}
                </p>

                {!nicotineFreeProgress.hasFreedomWeek && (
                  <div className="mt-3">
                    <Progress
                      value={nicotineFreeProgress.progressToFreedomWeek}
                      className="h-2 [&>div]:bg-emerald-500"
                    />
                  </div>
                )}

                {nicotineFreeProgress.isInNicotineFreePhase &&
                  nicotineFreeProgress.todayTotalCount > 0 && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Today: {nicotineFreeProgress.todayZeroMgCount}{" "}
                      nicotine-free pouches logged
                    </p>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-primary text-2xl font-semibold">
              {moneySaved !== null
                ? `${getCurrencySymbol(settings.currency)}${moneySaved}`
                : "—"}
            </p>
            <p className="text-muted-foreground text-xs">Money Saved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-primary text-2xl font-semibold">
              {daysSinceStart}
            </p>
            <p className="text-muted-foreground text-xs">Days on Journey</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Phase */}
      {currentPhase && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Phase {currentPhase.phaseNumber}
                </p>
                <p className="text-muted-foreground text-xs">
                  Week {currentPhase.weekStart}-{currentPhase.weekEnd}
                </p>
              </div>
              <div className="text-right">
                <p className="text-primary text-sm font-medium">
                  {currentPhase.dailyLimit} pouches/day
                </p>
                <p className="text-muted-foreground text-xs">
                  {currentPhase.strengthMg}mg strength
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Log Sheet */}
      <QuickLogSheet
        open={logSheetOpen}
        onOpenChange={setLogSheetOpen}
        onLog={handleLogPouch}
        onReflection={handleReflection}
        strengthMg={strengthMg}
        isOverLimit={timer.isOverLimit}
        remaining={remaining}
      />

      {/* Craving Support Modal */}
      <CravingSupportModal
        open={cravingSupportOpen}
        onOpenChange={setCravingSupportOpen}
        personalWhy={settings.personalWhy}
        moneySaved={
          moneySaved
            ? `${getCurrencySymbol(settings.currency)}${moneySaved}`
            : null
        }
        currentStreak={daysSinceStart}
      />
    </div>
  );
}

// Loading state while Evolu queries load
function HomeLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="relative overflow-hidden">
        <div className="from-primary/10 to-secondary/10 absolute inset-0 bg-gradient-to-br" />
        <CardHeader className="relative pb-2 text-center">
          <CardDescription>Loading...</CardDescription>
          <CardTitle className="text-primary/50 text-5xl font-light tracking-tight tabular-nums">
            --:--
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <Button size="lg" className="h-14 w-full text-lg" disabled>
            Log a Pouch
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function HomeContent() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContentInner />
    </Suspense>
  );
}
