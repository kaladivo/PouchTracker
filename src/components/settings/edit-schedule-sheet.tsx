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

interface EditScheduleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWakeTime: string;
  currentSleepTime: string;
  currentInterval: number;
  onSave: (wakeTime: string, sleepTime: string, interval: number) => void;
}

function EditScheduleForm({
  currentWakeTime,
  currentSleepTime,
  currentInterval,
  onSave,
  onClose,
}: {
  currentWakeTime: string;
  currentSleepTime: string;
  currentInterval: number;
  onSave: (wakeTime: string, sleepTime: string, interval: number) => void;
  onClose: () => void;
}) {
  const [wakeTime, setWakeTime] = useState(currentWakeTime);
  const [sleepTime, setSleepTime] = useState(currentSleepTime);
  const [interval, setInterval] = useState(currentInterval);

  const handleSave = () => {
    onSave(wakeTime, sleepTime, interval);
    onClose();
  };

  const intervalOptions = [
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
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
