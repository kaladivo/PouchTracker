"use client";

import { Suspense, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Check,
  Clock,
  ChevronRight,
  Plus,
  AlertTriangle,
  Heart,
  X,
  Pencil,
} from "lucide-react";
import {
  useUserSettings,
  useTaperingPhases,
  usePouchFreeMutation,
} from "@/lib/evolu/hooks";
import { EditPlanSheet } from "@/components/settings";
import { useStruggleDetection } from "@/hooks/use-struggle-detection";
import { toast } from "sonner";
import type { TaperingPhaseId } from "@/lib/evolu/schema";

function PlanContentInner() {
  const settings = useUserSettings();
  const phases = useTaperingPhases();
  const { updateSettings, extendPhase, updatePhaseWeeks, updatePhaseDetails } =
    usePouchFreeMutation();
  const struggleDetection = useStruggleDetection();

  const [extendSheetOpen, setExtendSheetOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [editPlanSheetOpen, setEditPlanSheetOpen] = useState(false);
  const [struggleBannerDismissed, setStruggleBannerDismissed] = useState(false);

  // Capture current time once on mount to avoid impure Date.now() in render
  const [now] = useState(() => Date.now());

  // Calculate current week since start
  const { daysSinceStart, currentWeek } = useMemo(() => {
    const startDate = settings?.startDate
      ? new Date(settings.startDate)
      : new Date();
    const days = Math.floor(
      (now - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { daysSinceStart: days, currentWeek: Math.floor(days / 7) + 1 };
  }, [settings, now]);

  // Determine status for each phase
  const phasesWithStatus = phases.map((phase) => {
    const phaseNum = phase.phaseNumber ?? 0;
    const isCompleted = settings?.currentPhase
      ? phaseNum < settings.currentPhase
      : false;
    const isCurrent = phaseNum === settings?.currentPhase;

    return {
      ...phase,
      status: isCompleted ? "completed" : isCurrent ? "current" : "upcoming",
      isCompleted,
      isCurrent,
    };
  });

  const currentPhase = phasesWithStatus.find((p) => p.isCurrent);

  // Calculate progress within current phase
  const getPhaseProgress = () => {
    if (!currentPhase) return 0;
    const weekStart = currentPhase.weekStart ?? 1;
    const weekEnd = currentPhase.weekEnd ?? 2;
    const phaseWeeks = weekEnd - weekStart + 1;
    const weeksInPhase = currentWeek - weekStart + 1;
    return Math.min((weeksInPhase / phaseWeeks) * 100, 100);
  };

  // Handle phase advancement
  const handleAdvancePhase = () => {
    if (!settings?.id || !currentPhase) return;
    const currentPhaseNum = currentPhase.phaseNumber ?? 1;
    const nextPhaseNumber = currentPhaseNum + 1;
    if (nextPhaseNumber <= phases.length) {
      updateSettings(settings.id, { currentPhase: nextPhaseNumber });
    }
  };

  // Handle extending the current phase
  const handleExtendPhase = (weeks: number) => {
    if (!currentPhase) return;

    const phaseId = currentPhase.id;
    const currentWeekEnd = currentPhase.weekEnd ?? 2;
    const newWeekEnd = currentWeekEnd + weeks;

    // Mark phase as extended and update week range
    extendPhase(phaseId);
    updatePhaseWeeks(phaseId, { weekEnd: newWeekEnd });

    // Also shift all subsequent phases
    const subsequentPhases = phases.filter(
      (p) => (p.phaseNumber ?? 0) > (currentPhase.phaseNumber ?? 0)
    );
    subsequentPhases.forEach((phase) => {
      const shiftedStart = (phase.weekStart ?? 1) + weeks;
      const shiftedEnd = (phase.weekEnd ?? 2) + weeks;
      updatePhaseWeeks(phase.id, {
        weekStart: shiftedStart,
        weekEnd: shiftedEnd,
      });
    });

    setExtendSheetOpen(false);
    toast.success(`Phase extended by ${weeks} week${weeks > 1 ? "s" : ""}`, {
      description: "Take your time - you're doing great!",
    });
  };

  // Handle saving edited plan
  const handleSavePlan = (
    updates: Array<{
      id: TaperingPhaseId;
      dailyLimit: number;
      strengthMg: number;
      weekStart: number;
      weekEnd: number;
    }>
  ) => {
    for (const update of updates) {
      updatePhaseDetails(update.id, {
        dailyLimit: update.dailyLimit,
        strengthMg: update.strengthMg,
        weekStart: update.weekStart,
        weekEnd: update.weekEnd,
      });
    }
    toast.success("Plan updated", {
      description: "Your customized plan has been saved.",
    });
  };

  // Handle resetting plan to default (regenerates phases)
  const handleResetPlanToDefault = () => {
    if (!settings) return;

    const baseline = settings.baselineDailyPouches ?? 10;
    const strength = settings.baselineStrengthMg ?? 6;

    // Phase 1: Awareness (weeks 1-2)
    const phase1 = phases.find((p) => p.phaseNumber === 1);
    if (phase1) {
      updatePhaseDetails(phase1.id, {
        dailyLimit: baseline,
        strengthMg: strength,
        weekStart: 1,
        weekEnd: 2,
      });
    }

    // Phase 2: Reduce quantity by ~25% (weeks 3-6)
    const phase2Pouches = Math.max(Math.round(baseline * 0.75), 4);
    const phase2 = phases.find((p) => p.phaseNumber === 2);
    if (phase2) {
      updatePhaseDetails(phase2.id, {
        dailyLimit: phase2Pouches,
        strengthMg: strength,
        weekStart: 3,
        weekEnd: 6,
      });
    }

    // Phase 3: Lower strength (weeks 7-10)
    const phase3Strength = strength > 4 ? Math.max(strength - 2, 4) : strength;
    const phase3Pouches = Math.max(Math.round(phase2Pouches * 0.75), 3);
    const phase3 = phases.find((p) => p.phaseNumber === 3);
    if (phase3) {
      updatePhaseDetails(phase3.id, {
        dailyLimit: phase3Pouches,
        strengthMg: phase3Strength,
        weekStart: 7,
        weekEnd: 10,
      });
    }

    // Phase 4: Minimal (weeks 11-14)
    const phase4Strength = phase3Strength > 2 ? 2 : phase3Strength;
    const phase4 = phases.find((p) => p.phaseNumber === 4);
    if (phase4) {
      updatePhaseDetails(phase4.id, {
        dailyLimit: Math.max(Math.round(phase3Pouches * 0.5), 2),
        strengthMg: phase4Strength,
        weekStart: 11,
        weekEnd: 14,
      });
    }

    // Phase 5: Freedom (weeks 15+)
    const phase5 = phases.find((p) => p.phaseNumber === 5);
    if (phase5) {
      updatePhaseDetails(phase5.id, {
        dailyLimit: 0,
        strengthMg: 0,
        weekStart: 15,
        weekEnd: 1014,
      });
    }

    toast.success("Plan reset to default", {
      description: "Your plan has been regenerated based on your baseline.",
    });
  };

  // Get phase name based on number
  const getPhaseLabel = (phaseNumber: number) => {
    const labels = ["Awareness", "Reducing", "Lowering", "Minimal", "Freedom"];
    return labels[phaseNumber - 1] || `Phase ${phaseNumber}`;
  };

  if (!settings) {
    return <PlanLoading />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Your Plan</h1>

      {/* Struggle Detection Banner */}
      {struggleDetection.shouldShowSuggestion && !struggleBannerDismissed && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                <Heart className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  You&apos;re doing your best
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  You&apos;ve exceeded your limit on{" "}
                  {struggleDetection.overLimitDays} of the last{" "}
                  {struggleDetection.totalDaysWithLogs} days. That&apos;s okay -
                  this is a sign you might benefit from extending the current
                  phase.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 bg-white hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50"
                    onClick={() => setExtendSheetOpen(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Extend Phase
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-amber-700 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-900/30"
                    onClick={() => setStruggleBannerDismissed(true)}
                  >
                    I&apos;m okay
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-amber-600 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-900/30"
                onClick={() => setStruggleBannerDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Phase Highlight */}
      {currentPhase && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Current Phase</CardDescription>
                <CardTitle className="text-xl">
                  Phase {currentPhase.phaseNumber ?? 1}:{" "}
                  {getPhaseLabel(currentPhase.phaseNumber ?? 1)}
                </CardTitle>
              </div>
              <div className="text-right">
                <p className="text-primary text-2xl font-semibold">
                  {currentPhase.dailyLimit}
                </p>
                <p className="text-muted-foreground text-xs">pouches/day</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Week {currentWeek} (Phase weeks {currentPhase.weekStart}-
                  {currentPhase.weekEnd})
                </span>
                <span className="text-muted-foreground">
                  {currentPhase.strengthMg}mg strength
                </span>
              </div>
              <Progress value={getPhaseProgress()} className="h-2" />
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                size="sm"
                onClick={() => setExtendSheetOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Extend Phase
              </Button>
              {getPhaseProgress() >= 75 &&
                (currentPhase.phaseNumber ?? 1) < phases.length && (
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={handleAdvancePhase}
                  >
                    Next Phase
                  </Button>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tapering Timeline</CardTitle>
          <CardDescription>Your personalized quit journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {phasesWithStatus.map((phase, index) => (
            <div
              key={phase.id}
              className={`flex items-start gap-3 py-3 ${
                index !== phasesWithStatus.length - 1
                  ? "border-border border-b"
                  : ""
              }`}
            >
              {/* Status indicator */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  phase.status === "completed"
                    ? "bg-primary text-primary-foreground"
                    : phase.status === "current"
                      ? "bg-primary/20 text-primary ring-primary ring-2"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {phase.status === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : phase.status === "current" ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">
                    {phase.phaseNumber ?? 0}
                  </span>
                )}
              </div>

              {/* Phase details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p
                    className={`font-medium ${
                      phase.status === "upcoming" ? "text-muted-foreground" : ""
                    }`}
                  >
                    {getPhaseLabel(phase.phaseNumber ?? 0)}
                  </p>
                  <span className="text-muted-foreground text-sm">
                    Weeks {phase.weekStart ?? 1}-{phase.weekEnd ?? 2}
                    {phase.isExtended ? " (extended)" : ""}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {(phase.dailyLimit ?? 0) > 0
                    ? `${phase.dailyLimit} pouches/day · ${phase.strengthMg}mg`
                    : "Pouch-free!"}
                </p>
              </div>

              <ChevronRight className="text-muted-foreground h-5 w-5 shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Journey Stats */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-primary text-2xl font-semibold">
                {daysSinceStart}
              </p>
              <p className="text-muted-foreground text-xs">Days</p>
            </div>
            <div>
              <p className="text-primary text-2xl font-semibold">
                {currentWeek}
              </p>
              <p className="text-muted-foreground text-xs">Week</p>
            </div>
            <div>
              <p className="text-primary text-2xl font-semibold">
                {settings?.currentPhase || 1}/{phases.length}
              </p>
              <p className="text-muted-foreground text-xs">Phase</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adjust Your Plan</CardTitle>
          <CardDescription>
            It&apos;s okay to go at your own pace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setEditPlanSheetOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span>Customize plan</span>
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive w-full justify-start"
            onClick={() => setResetConfirmOpen(true)}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Reset journey</span>
          </Button>
        </CardContent>
      </Card>

      {/* Edit Plan Sheet */}
      <EditPlanSheet
        open={editPlanSheetOpen}
        onOpenChange={setEditPlanSheetOpen}
        phases={phases}
        baselineDailyPouches={settings?.baselineDailyPouches ?? 10}
        baselineStrengthMg={settings?.baselineStrengthMg ?? 6}
        onSave={handleSavePlan}
        onResetToDefault={handleResetPlanToDefault}
      />

      {/* Extend Phase Sheet */}
      <Sheet open={extendSheetOpen} onOpenChange={setExtendSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>Extend Current Phase</SheetTitle>
            <SheetDescription>
              Take your time - extending a phase is a sign of self-awareness,
              not failure.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            {currentPhase && (
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm font-medium">
                  Phase {currentPhase.phaseNumber}:{" "}
                  {getPhaseLabel(currentPhase.phaseNumber ?? 0)}
                </p>
                <p className="text-muted-foreground text-xs">
                  Currently weeks {currentPhase.weekStart}-
                  {currentPhase.weekEnd}
                  {currentPhase.isExtended && " (already extended)"}
                </p>
              </div>
            )}

            <p className="text-muted-foreground text-sm">
              How much more time do you need? Your subsequent phases will adjust
              automatically.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => handleExtendPhase(1)}
              >
                <span className="text-lg font-semibold">+1</span>
                <span className="text-muted-foreground text-xs">week</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => handleExtendPhase(2)}
              >
                <span className="text-lg font-semibold">+2</span>
                <span className="text-muted-foreground text-xs">weeks</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => handleExtendPhase(4)}
              >
                <span className="text-lg font-semibold">+4</span>
                <span className="text-muted-foreground text-xs">weeks</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setExtendSheetOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reset Confirmation Sheet */}
      <Sheet open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="text-destructive">
              Reset Your Journey?
            </SheetTitle>
            <SheetDescription>
              This will start you back at Phase 1. Your log history will be
              preserved.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="bg-destructive/10 border-destructive/20 rounded-xl border p-4">
              <p className="text-muted-foreground text-sm">
                Starting over is brave. Many successful quitters needed multiple
                attempts. Your previous data can help you understand your
                patterns better this time.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setResetConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  if (settings?.id) {
                    updateSettings(settings.id, { currentPhase: 1 });
                  }
                  setResetConfirmOpen(false);
                }}
              >
                Reset to Phase 1
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PlanLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Your Plan</h1>
      <Card>
        <CardHeader className="pb-2">
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          <div className="bg-muted mt-1 h-6 w-40 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-2 w-full animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  );
}

export function PlanContent() {
  return (
    <Suspense fallback={<PlanLoading />}>
      <PlanContentInner />
    </Suspense>
  );
}
