"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import {
  Timer,
  Wind,
  Heart,
  Lightbulb,
  Check,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { usePouchTrackerMutation } from "@/lib/evolu/hooks";

type SupportMode =
  | "menu"
  | "timer"
  | "breathing"
  | "motivation"
  | "distractions";

const distractions = [
  { emoji: "🚶", text: "Take a short walk" },
  { emoji: "💧", text: "Drink a glass of water" },
  { emoji: "🎵", text: "Listen to a favorite song" },
  { emoji: "📱", text: "Text a friend" },
  { emoji: "🧊", text: "Hold ice cubes briefly" },
  { emoji: "🫁", text: "Take 10 deep breaths" },
  { emoji: "🎮", text: "Play a quick game" },
  { emoji: "📖", text: "Read something interesting" },
];

interface CravingSupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personalWhy?: string | null;
  moneySaved?: string | null;
  currentStreak?: number;
}

export function CravingSupportModal({
  open,
  onOpenChange,
  personalWhy,
  moneySaved,
  currentStreak = 0,
}: CravingSupportModalProps) {
  const [mode, setMode] = useState<SupportMode>("menu");
  const [timerSeconds, setTimerSeconds] = useState(5 * 60); // 5 minutes
  const [timerRunning, setTimerRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">(
    "inhale"
  );
  const [breathCount, setBreathCount] = useState(0);

  const { logMetricEvent } = usePouchTrackerMutation();
  const hasLoggedUsage = useRef(false);

  // Log craving support usage when modal opens
  useEffect(() => {
    if (open && !hasLoggedUsage.current) {
      logMetricEvent({ eventType: "craving_support_use" });
      hasLoggedUsage.current = true;
    }
    if (!open) {
      hasLoggedUsage.current = false;
    }
  }, [open, logMetricEvent]);

  // 5-minute timer
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimerSeconds((s) => s - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Breathing exercise (4-7-8 pattern)
  useEffect(() => {
    if (mode !== "breathing" || breathCount >= 4) return;

    const phases = { inhale: 4000, hold: 7000, exhale: 8000 };
    const nextPhase = {
      inhale: "hold",
      hold: "exhale",
      exhale: "inhale",
    } as const;

    const timeout = setTimeout(() => {
      if (breathPhase === "exhale") {
        setBreathCount((c) => c + 1);
      }
      setBreathPhase(nextPhase[breathPhase]);
    }, phases[breathPhase]);

    return () => clearTimeout(timeout);
  }, [mode, breathPhase, breathCount]);

  const handleClose = useCallback(() => {
    setMode("menu");
    setTimerSeconds(5 * 60);
    setTimerRunning(false);
    setBreathPhase("inhale");
    setBreathCount(0);
    onOpenChange(false);
  }, [onOpenChange]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const resetTimer = () => {
    setTimerSeconds(5 * 60);
    setTimerRunning(false);
  };

  const startBreathing = () => {
    setBreathPhase("inhale");
    setBreathCount(0);
    setMode("breathing");
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl"
      >
        {mode === "menu" && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle>Craving Support</SheetTitle>
              <SheetDescription>
                Choose a tool to help you wait it out. You&apos;ve got this!
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3 py-6">
              <button
                onClick={() => setMode("timer")}
                className="bg-card hover:bg-muted flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors"
              >
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                  <Timer className="text-primary h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">Wait 5 Minutes</p>
                  <p className="text-muted-foreground text-sm">
                    Cravings usually pass in 5-10 minutes
                  </p>
                </div>
              </button>

              <button
                onClick={startBreathing}
                className="bg-card hover:bg-muted flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors"
              >
                <div className="bg-secondary/10 flex h-12 w-12 items-center justify-center rounded-full">
                  <Wind className="text-secondary h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">Breathing Exercise</p>
                  <p className="text-muted-foreground text-sm">
                    2-minute guided 4-7-8 breathing
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode("motivation")}
                className="bg-card hover:bg-muted flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors"
              >
                <div className="bg-warning/10 flex h-12 w-12 items-center justify-center rounded-full">
                  <Heart className="text-warning h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">Your Motivation</p>
                  <p className="text-muted-foreground text-sm">
                    Remember why you started
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode("distractions")}
                className="bg-card hover:bg-muted flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors"
              >
                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                  <Lightbulb className="text-muted-foreground h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">Distraction Ideas</p>
                  <p className="text-muted-foreground text-sm">
                    Quick activities to occupy your mind
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {mode === "timer" && (
          <>
            <SheetHeader className="text-center">
              <SheetTitle>Wait 5 Minutes</SheetTitle>
              <SheetDescription>
                Most cravings pass within 5-10 minutes. You can do this!
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col items-center py-8">
              <div className="relative mb-6 h-48 w-48">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (timerSeconds / 300)}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-light tabular-nums">
                    {formatTime(timerSeconds)}
                  </span>
                </div>
              </div>

              {timerSeconds <= 0 ? (
                <div className="mb-6 text-center">
                  <div className="bg-primary/10 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
                    <Check className="text-primary h-8 w-8" />
                  </div>
                  <p className="text-primary font-medium">You did it!</p>
                  <p className="text-muted-foreground text-sm">
                    The craving should be weaker now
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground mb-6 text-center text-sm">
                  {timerRunning
                    ? "Breathe. You're stronger than this craving."
                    : "Press play to start the timer"}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={resetTimer}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={() => setTimerRunning(!timerRunning)}
                  disabled={timerSeconds <= 0}
                >
                  {timerRunning ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="ml-0.5 h-6 w-6" />
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                className="mt-6"
                onClick={() => setMode("menu")}
              >
                Back to menu
              </Button>
            </div>
          </>
        )}

        {mode === "breathing" && (
          <>
            <SheetHeader className="text-center">
              <SheetTitle>4-7-8 Breathing</SheetTitle>
              <SheetDescription>
                {breathCount >= 4
                  ? "Great job! Feeling calmer?"
                  : `Breath ${breathCount + 1} of 4`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col items-center py-8">
              {breathCount >= 4 ? (
                <>
                  <div className="bg-primary/10 mb-6 flex h-32 w-32 items-center justify-center rounded-full">
                    <Check className="text-primary h-16 w-16" />
                  </div>
                  <p className="mb-2 text-lg font-medium">Exercise Complete</p>
                  <p className="text-muted-foreground mb-6 text-center text-sm">
                    Your body should feel more relaxed now
                  </p>
                  <Button onClick={() => setMode("menu")}>Back to menu</Button>
                </>
              ) : (
                <>
                  <div
                    className={`mb-6 flex h-40 w-40 items-center justify-center rounded-full transition-all duration-1000 ${
                      breathPhase === "inhale"
                        ? "bg-primary/20 scale-110"
                        : breathPhase === "hold"
                          ? "bg-primary/30 scale-110"
                          : "bg-primary/10 scale-90"
                    }`}
                  >
                    <span className="text-primary text-2xl font-light capitalize">
                      {breathPhase === "hold" ? "Hold" : breathPhase}
                    </span>
                  </div>

                  <p className="text-muted-foreground mb-6 text-center text-sm">
                    {breathPhase === "inhale" &&
                      "Breathe in slowly through your nose"}
                    {breathPhase === "hold" && "Hold your breath gently"}
                    {breathPhase === "exhale" &&
                      "Exhale slowly through your mouth"}
                  </p>

                  <Progress
                    value={((breathCount + 1) / 4) * 100}
                    className="h-2 w-full max-w-xs"
                  />

                  <Button
                    variant="ghost"
                    className="mt-6"
                    onClick={() => setMode("menu")}
                  >
                    Back to menu
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {mode === "motivation" && (
          <>
            <SheetHeader className="text-center">
              <SheetTitle>Your Motivation</SheetTitle>
              <SheetDescription>
                Remember why you started this journey
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-6">
              {personalWhy && (
                <div className="bg-primary/5 border-primary/20 rounded-xl border p-4">
                  <p className="text-primary mb-1 text-sm font-medium">
                    Your Why
                  </p>
                  <p className="text-foreground text-sm">{personalWhy}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {moneySaved && (
                  <div className="bg-card rounded-xl p-4 text-center">
                    <p className="text-primary text-2xl font-semibold">
                      {moneySaved}
                    </p>
                    <p className="text-muted-foreground text-xs">Money Saved</p>
                  </div>
                )}
                <div className="bg-card rounded-xl p-4 text-center">
                  <p className="text-primary text-2xl font-semibold">
                    {currentStreak}
                  </p>
                  <p className="text-muted-foreground text-xs">Day Streak</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-muted-foreground text-center text-sm italic">
                  &quot;Every moment you resist makes you stronger. You&apos;re
                  building a new version of yourself.&quot;
                </p>
              </div>

              <Button className="w-full" onClick={() => setMode("menu")}>
                Back to menu
              </Button>
            </div>
          </>
        )}

        {mode === "distractions" && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle>Distraction Ideas</SheetTitle>
              <SheetDescription>
                Pick something to occupy your hands and mind
              </SheetDescription>
            </SheetHeader>

            <div className="py-6">
              <div className="mb-6 grid grid-cols-2 gap-2">
                {distractions.map((item, i) => (
                  <div key={i} className="bg-card rounded-xl p-3 text-center">
                    <span className="mb-1 block text-2xl">{item.emoji}</span>
                    <span className="text-muted-foreground text-xs">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={() => setMode("menu")}>
                Back to menu
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
