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
import { Check, AlertTriangle, Clock, ChevronLeft } from "lucide-react";
import type { TriggerType } from "@/lib/evolu/schema";
import { OverLimitReflection } from "./over-limit-reflection";

const triggers: { value: TriggerType; label: string; emoji: string }[] = [
  { value: "habit", label: "Habit", emoji: "🔄" },
  { value: "stress", label: "Stress", emoji: "😰" },
  { value: "after_meal", label: "After meal", emoji: "🍽️" },
  { value: "craving", label: "Craving", emoji: "🫠" },
  { value: "social", label: "Social", emoji: "👥" },
  { value: "boredom", label: "Boredom", emoji: "😐" },
];

interface QuickLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLog: (trigger: TriggerType | undefined, timestamp?: Date) => void;
  onReflection?: (feeling: string, nextTimePlan: string) => void;
  strengthMg: number;
  isOverLimit: boolean;
  remaining: number;
}

export function QuickLogSheet({
  open,
  onOpenChange,
  onLog,
  onReflection,
  strengthMg,
  isOverLimit,
  remaining,
}: QuickLogSheetProps) {
  const [selectedTrigger, setSelectedTrigger] = useState<
    TriggerType | undefined
  >();
  const [step, setStep] = useState<"trigger" | "backfill">("trigger");
  const [showReflection, setShowReflection] = useState(false);
  const [backfillDate, setBackfillDate] = useState<string>("");
  const [backfillTime, setBackfillTime] = useState<string>("");

  const handleLog = (isBackfill = false) => {
    let timestamp: Date | undefined;

    if (isBackfill && backfillDate && backfillTime) {
      timestamp = new Date(`${backfillDate}T${backfillTime}`);
    }

    onLog(selectedTrigger, timestamp);

    // Show reflection if over limit
    if (isOverLimit && !isBackfill) {
      setShowReflection(true);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedTrigger(undefined);
    setStep("trigger");
    setBackfillDate("");
    setBackfillTime("");
    onOpenChange(false);
  };

  const handleReflectionSubmit = (feeling: string, nextTimePlan: string) => {
    onReflection?.(feeling, nextTimePlan);
    setShowReflection(false);
    handleClose();
  };

  const handleReflectionSkip = () => {
    setShowReflection(false);
    handleClose();
  };

  // Get today's date and current time for backfill defaults
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 5);

  return (
    <>
      <Sheet open={open && !showReflection} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>
              {step === "backfill"
                ? "Log Past Pouch"
                : isOverLimit
                  ? "Over your limit"
                  : "Log a Pouch"}
            </SheetTitle>
            <SheetDescription>
              {step === "backfill"
                ? "When did you use this pouch?"
                : isOverLimit
                  ? "You've reached today's limit. Log anyway?"
                  : `${strengthMg}mg · ${remaining} remaining today`}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6">
            {isOverLimit && step === "trigger" && (
              <div className="bg-destructive/10 border-destructive/20 mb-6 rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-destructive text-sm font-medium">
                      You&apos;ve reached your daily limit
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      It&apos;s okay - logging honestly helps you understand
                      your patterns. Be kind to yourself.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === "trigger" && (
              <>
                <p className="text-muted-foreground mb-3 text-sm">
                  What triggered this? (optional)
                </p>
                <div className="mb-6 grid grid-cols-3 gap-2">
                  {triggers.map((trigger) => (
                    <button
                      key={trigger.value}
                      onClick={() =>
                        setSelectedTrigger(
                          selectedTrigger === trigger.value
                            ? undefined
                            : trigger.value
                        )
                      }
                      className={`rounded-xl px-2 py-3 text-center transition-all ${
                        selectedTrigger === trigger.value
                          ? "bg-primary/15 ring-primary ring-2"
                          : "bg-card hover:bg-muted"
                      }`}
                    >
                      <span className="mb-1 block text-xl">
                        {trigger.emoji}
                      </span>
                      <span className="text-xs">{trigger.label}</span>
                    </button>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="h-14 w-full"
                  onClick={() => handleLog(false)}
                >
                  <Check className="mr-2 h-5 w-5" />
                  Log Pouch
                </Button>

                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    onClick={() => handleLog(false)}
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    Skip trigger & log
                  </button>
                  <span className="text-muted-foreground">·</span>
                  <button
                    onClick={() => {
                      setBackfillDate(today);
                      setBackfillTime(now);
                      setStep("backfill");
                    }}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
                  >
                    <Clock className="h-3 w-3" />
                    Log past pouch
                  </button>
                </div>
              </>
            )}

            {step === "backfill" && (
              <>
                <button
                  onClick={() => setStep("trigger")}
                  className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm">Back</span>
                </button>

                <div className="mb-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Date
                    </label>
                    <input
                      type="date"
                      value={backfillDate}
                      onChange={(e) => setBackfillDate(e.target.value)}
                      max={today}
                      className="bg-card border-input focus:ring-ring w-full rounded-xl border px-4 py-3 focus:ring-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Time
                    </label>
                    <input
                      type="time"
                      value={backfillTime}
                      onChange={(e) => setBackfillTime(e.target.value)}
                      className="bg-card border-input focus:ring-ring w-full rounded-xl border px-4 py-3 focus:ring-2 focus:outline-none"
                    />
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 text-center text-xs">
                  Past entries are marked as backfilled in your history
                </p>

                <Button
                  size="lg"
                  className="h-14 w-full"
                  onClick={() => handleLog(true)}
                  disabled={!backfillDate || !backfillTime}
                >
                  <Check className="mr-2 h-5 w-5" />
                  Log Past Pouch
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <OverLimitReflection
        open={showReflection}
        onOpenChange={setShowReflection}
        onSubmit={handleReflectionSubmit}
        onSkip={handleReflectionSkip}
      />
    </>
  );
}
