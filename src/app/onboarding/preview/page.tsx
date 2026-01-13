"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useOnboarding, StepIndicator } from "@/components/onboarding";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";

// Generate tapering plan based on user's current usage
function generatePlan(currentPouches: number, currentStrength: number) {
  const phases = [];

  // Phase 1: Awareness (maintain current, just track)
  phases.push({
    phase: 1,
    name: "Awareness",
    weeks: 2,
    dailyLimit: currentPouches,
    strengthMg: currentStrength,
    description: "Track your usage and identify triggers",
  });

  // Phase 2: Reduce quantity by ~25%
  const phase2Pouches = Math.max(Math.round(currentPouches * 0.75), 4);
  phases.push({
    phase: 2,
    name: "Reducing",
    weeks: 4,
    dailyLimit: phase2Pouches,
    strengthMg: currentStrength,
    description: "Gradually reduce daily pouch count",
  });

  // Phase 3: Lower strength (if > 4mg)
  const phase3Strength =
    currentStrength > 4 ? Math.max(currentStrength - 2, 4) : currentStrength;
  const phase3Pouches = Math.max(Math.round(phase2Pouches * 0.75), 3);
  phases.push({
    phase: 3,
    name: "Lowering",
    weeks: 4,
    dailyLimit: phase3Pouches,
    strengthMg: phase3Strength,
    description: "Reduce both quantity and strength",
  });

  // Phase 4: Minimal
  const phase4Strength = phase3Strength > 2 ? 2 : phase3Strength;
  phases.push({
    phase: 4,
    name: "Minimal",
    weeks: 4,
    dailyLimit: Math.max(Math.round(phase3Pouches * 0.5), 2),
    strengthMg: phase4Strength,
    description: "Reach minimal sustainable use",
  });

  // Phase 5: Freedom
  phases.push({
    phase: 5,
    name: "Freedom",
    weeks: null,
    dailyLimit: 0,
    strengthMg: 0,
    description: "Pouch-free living!",
  });

  return phases;
}

export default function PreviewPage() {
  const router = useRouter();
  const { data, updateData, totalSteps, setCurrentStep } = useOnboarding();

  useEffect(() => {
    setCurrentStep(6);
  }, [setCurrentStep]);

  const plan = generatePlan(
    data.currentPouchesPerDay || 10,
    data.currentStrengthMg || 6
  );

  const totalWeeks = plan.reduce((sum, p) => sum + (p.weeks || 0), 0);

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/onboarding/cost")}
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <StepIndicator
          currentStep={6}
          totalSteps={totalSteps}
          className="mb-4"
        />
        <h1 className="text-2xl font-semibold">Your Plan</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personalized based on your usage. You can adjust anytime.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              {totalWeeks}-Week Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {plan.map((phase, index) => (
              <div
                key={phase.phase}
                className={`flex items-start gap-3 py-3 ${
                  index !== plan.length - 1 ? "border-border border-b" : ""
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    phase.phase === 5
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {phase.phase === 5 ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    phase.phase
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{phase.name}</p>
                    <span className="text-muted-foreground text-xs">
                      {phase.weeks ? `${phase.weeks} weeks` : "Ongoing"}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {phase.dailyLimit > 0
                      ? `${phase.dailyLimit} pouches/day · ${phase.strengthMg}mg`
                      : "Pouch-free!"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Personal Why */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your &quot;Why&quot;</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="why" className="sr-only">
              Why do you want to quit?
            </Label>
            <textarea
              id="why"
              placeholder="Why do you want to quit? (e.g., health, family, savings, freedom from addiction)"
              value={data.personalWhy}
              onChange={(e) => updateData({ personalWhy: e.target.value })}
              rows={3}
              className="bg-muted/50 border-input focus:ring-ring w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
            <p className="text-muted-foreground mt-2 text-xs">
              We&apos;ll show this when you need motivation
            </p>
          </CardContent>
        </Card>

        {/* Reassurance */}
        <div className="text-muted-foreground space-y-2 px-2 text-sm">
          <p>
            <strong className="text-foreground">Remember:</strong>
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>This plan is just a guide - go at your own pace</li>
            <li>You can extend any phase if you need more time</li>
            <li>Some days will be harder than others - that&apos;s okay</li>
            <li>Every pouch you don&apos;t use is a win</li>
          </ul>
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-6">
        <Button
          size="lg"
          className="h-14 w-full"
          onClick={() => router.push("/onboarding/ready")}
          disabled={!data.personalWhy.trim()}
        >
          Looks Good!
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {!data.personalWhy.trim() && (
          <p className="text-muted-foreground mt-2 text-center text-xs">
            Please fill in your &quot;why&quot; above to continue
          </p>
        )}
      </div>
    </div>
  );
}
