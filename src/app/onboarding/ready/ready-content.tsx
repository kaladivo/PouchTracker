"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboarding, StepIndicator } from "@/components/onboarding";
import { usePouchFreeMutation } from "@/lib/evolu/hooks";
import { ArrowLeft, Sparkles, Leaf, Heart, Trophy } from "lucide-react";

// Generate tapering plan based on user's current usage
function generatePlan(currentPouches: number, currentStrength: number) {
  const phases = [];
  let weekStart = 1;

  // Phase 1: Awareness (maintain current, just track)
  phases.push({
    phaseNumber: 1,
    weekStart,
    weekEnd: weekStart + 1,
    dailyLimit: currentPouches,
    strengthMg: currentStrength,
  });
  weekStart += 2;

  // Phase 2: Reduce quantity by ~25%
  const phase2Pouches = Math.max(Math.round(currentPouches * 0.75), 4);
  phases.push({
    phaseNumber: 2,
    weekStart,
    weekEnd: weekStart + 3,
    dailyLimit: phase2Pouches,
    strengthMg: currentStrength,
  });
  weekStart += 4;

  // Phase 3: Lower strength (if > 4mg)
  const phase3Strength =
    currentStrength > 4 ? Math.max(currentStrength - 2, 4) : currentStrength;
  const phase3Pouches = Math.max(Math.round(phase2Pouches * 0.75), 3);
  phases.push({
    phaseNumber: 3,
    weekStart,
    weekEnd: weekStart + 3,
    dailyLimit: phase3Pouches,
    strengthMg: phase3Strength,
  });
  weekStart += 4;

  // Phase 4: Minimal
  const phase4Strength = phase3Strength > 2 ? 2 : phase3Strength;
  phases.push({
    phaseNumber: 4,
    weekStart,
    weekEnd: weekStart + 3,
    dailyLimit: Math.max(Math.round(phase3Pouches * 0.5), 2),
    strengthMg: phase4Strength,
  });
  weekStart += 4;

  // Phase 5: Freedom
  phases.push({
    phaseNumber: 5,
    weekStart,
    weekEnd: weekStart + 999, // Ongoing phase
    dailyLimit: 0,
    strengthMg: 0,
  });

  return phases;
}

export function ReadyContent() {
  const router = useRouter();
  const { data, totalSteps, setCurrentStep } = useOnboarding();
  const { createUserSettings, createTaperingPhase } = usePouchFreeMutation();
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    setCurrentStep(7);
  }, [setCurrentStep]);

  const handleStart = async () => {
    setIsStarting(true);

    try {
      // Save user settings to database
      createUserSettings({
        wakeTime: data.wakeTime,
        sleepTime: data.sleepTime,
        currency: data.currency,
        pricePerCan: data.pricePerCan,
        pouchesPerCan: data.pouchesPerCan,
        baselineDailyPouches: data.currentPouchesPerDay || 10,
        baselineStrengthMg: data.currentStrengthMg || 6,
        personalWhy: data.personalWhy,
      });

      // Generate and save tapering phases
      const phases = generatePlan(
        data.currentPouchesPerDay || 10,
        data.currentStrengthMg || 6
      );

      for (const phase of phases) {
        createTaperingPhase(phase);
      }

      // Small delay to ensure mutations are processed
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Navigate to home
      router.push("/");
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/onboarding/preview")}
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <StepIndicator
          currentStep={7}
          totalSteps={totalSteps}
          className="mb-4"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {/* Celebration icon */}
        <div className="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <Sparkles className="text-primary h-10 w-10" />
        </div>

        <h1 className="mb-2 text-2xl font-semibold">You&apos;re Ready!</h1>
        <p className="text-muted-foreground mb-8 max-w-xs">
          Taking the first step is the hardest part. You&apos;ve already done
          it.
        </p>

        {/* Summary Cards */}
        <div className="mb-8 w-full space-y-3">
          <Card className="bg-muted/30">
            <CardContent className="flex items-center gap-3 p-4">
              <Leaf className="text-primary h-5 w-5 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Starting at</p>
                <p className="text-muted-foreground text-xs">
                  {data.currentPouchesPerDay || 10} pouches/day ·{" "}
                  {data.currentStrengthMg || 6}mg
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="flex items-center gap-3 p-4">
              <Heart className="text-secondary h-5 w-5 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Your why</p>
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {data.personalWhy || "A healthier, freer life"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="flex items-center gap-3 p-4">
              <Trophy className="text-warning h-5 w-5 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">First achievement</p>
                <p className="text-muted-foreground text-xs">
                  Log your first pouch to unlock &quot;Day One&quot;
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Encouragement */}
        <p className="text-muted-foreground max-w-xs text-sm">
          &quot;The journey of a thousand miles begins with a single step.&quot;
        </p>
      </div>

      {/* Start Button */}
      <div className="pt-6">
        <Button
          size="lg"
          className="h-14 w-full text-lg"
          onClick={handleStart}
          disabled={isStarting}
        >
          {isStarting ? (
            <>
              <span className="animate-pulse">Setting up...</span>
            </>
          ) : (
            "Start My Journey"
          )}
        </Button>
      </div>
    </div>
  );
}
