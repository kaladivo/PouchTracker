"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AUTO_INTERVAL_VALUE,
  calculateAutoInterval,
  calculateWakingMinutes,
} from "@/lib/utils";

interface EditScheduleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWakeTime: string;
  currentSleepTime: string;
  currentInterval: number;
  dailyLimit: number;
  onSave: (wakeTime: string, sleepTime: string, interval: number) => void;
}

function formatIntervalLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours === Math.floor(hours))
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours.toFixed(1)} hours`;
}

function EditScheduleForm({
  currentWakeTime,
  currentSleepTime,
  currentInterval,
  dailyLimit,
  onSave,
  onClose,
}: {
  currentWakeTime: string;
  currentSleepTime: string;
  currentInterval: number;
  dailyLimit: number;
  onSave: (wakeTime: string, sleepTime: string, interval: number) => void;
  onClose: () => void;
}) {
  const [wakeTime, setWakeTime] = useState(currentWakeTime);
  const [sleepTime, setSleepTime] = useState(currentSleepTime);
  const [interval, setInterval] = useState(currentInterval);

  // Calculate auto interval based on current wake/sleep times and daily limit
  const autoInterval = useMemo(
    () => calculateAutoInterval(wakeTime, sleepTime, dailyLimit),
    [wakeTime, sleepTime, dailyLimit]
  );

  // Calculate waking hours for display
  const wakingHours = useMemo(() => {
    const minutes = calculateWakingMinutes(wakeTime, sleepTime);
    return (minutes / 60).toFixed(1);
  }, [wakeTime, sleepTime]);

  const isAutoMode = interval === AUTO_INTERVAL_VALUE;

  const handleSave = () => {
    onSave(wakeTime, sleepTime, interval);
    onClose();
  };

  const intervalOptions = [
    { value: AUTO_INTERVAL_VALUE, label: "Auto" },
    { value: 30, label: "30 min" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
    { value: 150, label: "2.5 hours" },
    { value: 180, label: "3 hours" },
    { value: 240, label: "4 hours" },
  ];

  return (
    <div className="space-y-6 py-6">
      {/* Wake Time */}
      <div>
        <label className="mb-2 block text-sm font-medium">Wake Time</label>
        <input
          type="time"
          value={wakeTime}
          onChange={(e) => setWakeTime(e.target.value)}
          className="bg-card border-input focus:ring-ring w-full rounded-xl border px-4 py-3 focus:ring-2 focus:outline-none"
        />
      </div>

      {/* Sleep Time */}
      <div>
        <label className="mb-2 block text-sm font-medium">Sleep Time</label>
        <input
          type="time"
          value={sleepTime}
          onChange={(e) => setSleepTime(e.target.value)}
          className="bg-card border-input focus:ring-ring w-full rounded-xl border px-4 py-3 focus:ring-2 focus:outline-none"
        />
      </div>

      {/* Waking Hours Info */}
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">{wakingHours}</span>{" "}
          waking hours per day
        </p>
      </div>

      {/* Interval */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Interval Between Pouches
        </label>
        <div className="grid grid-cols-4 gap-2">
          {intervalOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setInterval(option.value)}
              className={`rounded-xl px-2 py-2 text-center text-sm transition-all ${
                interval === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border-input hover:bg-muted border"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Auto interval explanation */}
        {isAutoMode && (
          <div className="bg-primary/10 mt-3 rounded-lg p-3">
            <p className="text-sm">
              <span className="font-medium">Auto mode:</span> Interval is
              calculated as{" "}
              <span className="text-primary font-medium">
                {formatIntervalLabel(autoInterval)}
              </span>{" "}
              based on {wakingHours} waking hours and {dailyLimit} daily
              pouches.
            </p>
          </div>
        )}
      </div>

      <Button className="h-12 w-full" onClick={handleSave}>
        Save Changes
      </Button>
    </div>
  );
}

export function EditScheduleSheet({
  open,
  onOpenChange,
  currentWakeTime,
  currentSleepTime,
  currentInterval,
  dailyLimit,
  onSave,
}: EditScheduleSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>Edit Schedule</SheetTitle>
          <SheetDescription>
            Adjust your wake/sleep times and pouch interval
          </SheetDescription>
        </SheetHeader>

        {open && (
          <EditScheduleForm
            key={`${currentWakeTime}-${currentSleepTime}-${currentInterval}`}
            currentWakeTime={currentWakeTime}
            currentSleepTime={currentSleepTime}
            currentInterval={currentInterval}
            dailyLimit={dailyLimit}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
