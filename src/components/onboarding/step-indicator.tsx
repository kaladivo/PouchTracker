"use client";

import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function StepIndicator({
  currentStep,
  totalSteps,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            step === currentStep
              ? "bg-primary w-6"
              : step < currentStep
                ? "bg-primary/60 w-2"
                : "bg-muted-foreground/30 w-2"
          )}
        />
      ))}
    </div>
  );
}
