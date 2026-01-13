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
import { AlertTriangle } from "lucide-react";

interface EditBaselineSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDailyPouches: number;
  currentStrengthMg: number;
  onSave: (dailyPouches: number, strengthMg: number) => void;
}

function EditBaselineForm({
  currentDailyPouches,
  currentStrengthMg,
  onSave,
  onClose,
}: {
  currentDailyPouches: number;
  currentStrengthMg: number;
  onSave: (dailyPouches: number, strengthMg: number) => void;
  onClose: () => void;
}) {
  const [dailyPouches, setDailyPouches] = useState(currentDailyPouches);
  const [strengthMg, setStrengthMg] = useState(currentStrengthMg);

  const handleSave = () => {
    onSave(dailyPouches, strengthMg);
    onClose();
  };

  const dailyOptions = [5, 8, 10, 12, 15, 20, 25, 30];
  const strengthOptions = [4, 6, 8, 10, 12, 16, 20];

  return (
    <div className="space-y-6 py-6">
      {/* Warning notice */}
      <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-900/50 dark:bg-orange-950/30">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
        <p className="text-sm text-orange-700 dark:text-orange-300">
          Changing your baseline will affect future reduction calculations.
          Historical data will keep the previous baseline.
        </p>
      </div>

      {/* Daily Pouches */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Daily Pouches (starting point)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {dailyOptions.map((option) => (
            <button
              key={option}
              onClick={() => setDailyPouches(option)}
              className={`rounded-xl px-2 py-2 text-center text-sm transition-all ${
                dailyPouches === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border-input hover:bg-muted border"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Or enter a custom value:
        </p>
        <input
          type="number"
          min="1"
          max="50"
          value={dailyPouches}
          onChange={(e) => setDailyPouches(Number(e.target.value) || 1)}
          className="bg-card border-input focus:ring-ring mt-2 w-full rounded-xl border px-4 py-3 focus:ring-2 focus:outline-none"
        />
      </div>

      {/* Strength */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Strength (mg nicotine)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {strengthOptions.map((option) => (
            <button
              key={option}
              onClick={() => setStrengthMg(option)}
              className={`rounded-xl px-2 py-2 text-center text-sm transition-all ${
                strengthMg === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border-input hover:bg-muted border"
              }`}
            >
              {option}mg
            </button>
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Or enter a custom value:
        </p>
        <input
          type="number"
          min="1"
          max="50"
          value={strengthMg}
          onChange={(e) => setStrengthMg(Number(e.target.value) || 1)}
          className="bg-card border-input focus:ring-ring mt-2 w-full rounded-xl border px-4 py-3 focus:ring-2 focus:outline-none"
        />
      </div>

      <Button className="h-12 w-full" onClick={handleSave}>
        Save Changes
      </Button>
    </div>
  );
}

export function EditBaselineSheet({
  open,
  onOpenChange,
  currentDailyPouches,
  currentStrengthMg,
  onSave,
}: EditBaselineSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>Edit Baseline</SheetTitle>
          <SheetDescription>
            Update your starting daily usage for reduction calculations
          </SheetDescription>
        </SheetHeader>

        {open && (
          <EditBaselineForm
            key={`${currentDailyPouches}-${currentStrengthMg}`}
            currentDailyPouches={currentDailyPouches}
            currentStrengthMg={currentStrengthMg}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
