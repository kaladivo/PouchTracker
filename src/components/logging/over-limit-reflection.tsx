"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Heart, Sparkles } from "lucide-react";

const feelings = [
  { value: "stressed", label: "Stressed", emoji: "😰" },
  { value: "anxious", label: "Anxious", emoji: "😟" },
  { value: "bored", label: "Bored", emoji: "😐" },
  { value: "sad", label: "Sad", emoji: "😢" },
  { value: "frustrated", label: "Frustrated", emoji: "😤" },
  { value: "okay", label: "Actually okay", emoji: "🙂" },
];

interface OverLimitReflectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feeling: string, nextTimePlan: string) => void;
  onSkip: () => void;
}

export function OverLimitReflection({
  open,
  onOpenChange,
  onSubmit,
  onSkip,
}: OverLimitReflectionProps) {
  const [step, setStep] = useState<"feeling" | "plan" | "complete">("feeling");
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [plan, setPlan] = useState("");

  const handleClose = () => {
    setStep("feeling");
    setSelectedFeeling(null);
    setPlan("");
    onOpenChange(false);
  };

  const handleFeelingSelect = (feeling: string) => {
    setSelectedFeeling(feeling);
    setStep("plan");
  };

  const handleSubmitPlan = () => {
    onSubmit(selectedFeeling || "", plan);
    setStep("complete");
  };

  const handleComplete = () => {
    handleClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        {step === "feeling" && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2">
                <Heart className="text-primary h-5 w-5" />
                How are you feeling?
              </SheetTitle>
              <SheetDescription>
                It&apos;s okay - understanding your feelings helps you grow.
              </SheetDescription>
            </SheetHeader>

            <div className="py-6">
              <div className="mb-6 grid grid-cols-3 gap-2">
                {feelings.map((feeling) => (
                  <button
                    key={feeling.value}
                    onClick={() => handleFeelingSelect(feeling.value)}
                    className="bg-card hover:bg-muted rounded-xl px-2 py-4 text-center transition-all"
                  >
                    <span className="mb-1 block text-2xl">{feeling.emoji}</span>
                    <span className="text-xs">{feeling.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground w-full text-sm"
              >
                Skip for now
              </button>
            </div>
          </>
        )}

        {step === "plan" && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle>What could help next time?</SheetTitle>
              <SheetDescription>
                No pressure - just a thought to reflect on.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-6">
              <textarea
                placeholder="e.g., Take a walk, drink water, wait 5 more minutes..."
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={3}
                className="bg-card border-input focus:ring-ring w-full resize-none rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("feeling")}
                >
                  Back
                </Button>
                <Button className="flex-1" onClick={handleSubmitPlan}>
                  Save Reflection
                </Button>
              </div>

              <button
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground w-full text-sm"
              >
                Skip for now
              </button>
            </div>
          </>
        )}

        {step === "complete" && (
          <>
            <SheetHeader className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
                  <Sparkles className="text-primary h-8 w-8" />
                </div>
              </div>
              <SheetTitle>Thank you for reflecting</SheetTitle>
              <SheetDescription>
                Self-awareness is a superpower. Every reflection brings you
                closer to understanding yourself.
              </SheetDescription>
            </SheetHeader>

            <div className="py-6">
              <p className="text-muted-foreground mb-6 text-center text-sm">
                &quot;Be kind to yourself. You&apos;re doing better than you
                think.&quot;
              </p>
              <Button className="w-full" onClick={handleComplete}>
                Continue
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
