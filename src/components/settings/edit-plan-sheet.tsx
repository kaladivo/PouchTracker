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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, Save, Sparkles } from "lucide-react";
import type { TaperingPhaseId } from "@/lib/evolu/schema";

interface Phase {
  id: TaperingPhaseId;
  phaseNumber: number | null;
  dailyLimit: number | null;
  strengthMg: number | null;
  weekStart: number | null;
  weekEnd: number | null;
  isExtended: number | null;
}

interface EditPlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phases: readonly Phase[];
  baselineDailyPouches: number;
  baselineStrengthMg: number;
  onSave: (
    updates: Array<{
      id: TaperingPhaseId;
      dailyLimit: number;
      strengthMg: number;
      weekStart: number;
      weekEnd: number;
    }>
  ) => void;
  onResetToDefault: () => void;
}

interface EditablePhase {
  id: TaperingPhaseId;
  phaseNumber: number;
  dailyLimit: number;
  strengthMg: number;
  durationWeeks: number;
}

const PHASE_LABELS = [
  "Awareness",
  "Reducing",
  "Lowering",
  "Minimal",
  "Freedom",
];

function getPhaseLabel(phaseNumber: number): string {
  return PHASE_LABELS[phaseNumber - 1] || `Phase ${phaseNumber}`;
}

// Generate default plan based on baseline values
function generateDefaultPlan(
  currentPouches: number,
  currentStrength: number
): Omit<EditablePhase, "id">[] {
  const phases: Omit<EditablePhase, "id">[] = [];

  // Phase 1: Awareness (maintain current, just track) - 2 weeks
  phases.push({
    phaseNumber: 1,
    dailyLimit: currentPouches,
    strengthMg: currentStrength,
    durationWeeks: 2,
  });

  // Phase 2: Reduce quantity by ~25% - 4 weeks
  const phase2Pouches = Math.max(Math.round(currentPouches * 0.75), 4);
  phases.push({
    phaseNumber: 2,
    dailyLimit: phase2Pouches,
    strengthMg: currentStrength,
    durationWeeks: 4,
  });

  // Phase 3: Lower strength (if > 4mg) - 4 weeks
  const phase3Strength =
    currentStrength > 4 ? Math.max(currentStrength - 2, 4) : currentStrength;
  const phase3Pouches = Math.max(Math.round(phase2Pouches * 0.75), 3);
  phases.push({
    phaseNumber: 3,
    dailyLimit: phase3Pouches,
    strengthMg: phase3Strength,
    durationWeeks: 4,
  });

  // Phase 4: Minimal - 4 weeks
  const phase4Strength = phase3Strength > 2 ? 2 : phase3Strength;
  phases.push({
    phaseNumber: 4,
    dailyLimit: Math.max(Math.round(phase3Pouches * 0.5), 2),
    strengthMg: phase4Strength,
    durationWeeks: 4,
  });

  return phases;
}

function EditPlanForm({
  phases,
  baselineDailyPouches,
  baselineStrengthMg,
  onSave,
  onResetToDefault,
  onClose,
}: {
  phases: readonly Phase[];
  baselineDailyPouches: number;
  baselineStrengthMg: number;
  onSave: EditPlanSheetProps["onSave"];
  onResetToDefault: () => void;
  onClose: () => void;
}) {
  // Convert phases to editable format (excluding Phase 5 - Freedom)
  const initialEditablePhases = useMemo((): EditablePhase[] => {
    return phases
      .filter((p) => (p.phaseNumber ?? 0) < 5)
      .map((p) => ({
        id: p.id,
        phaseNumber: p.phaseNumber ?? 1,
        dailyLimit: p.dailyLimit ?? 0,
        strengthMg: p.strengthMg ?? 0,
        durationWeeks: (p.weekEnd ?? 2) - (p.weekStart ?? 1) + 1,
      }));
  }, [phases]);

  const [editablePhases, setEditablePhases] = useState<EditablePhase[]>(
    initialEditablePhases
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const phase5 = phases.find((p) => p.phaseNumber === 5);

  const updatePhase = (
    phaseNumber: number,
    field: keyof EditablePhase,
    value: number
  ) => {
    setEditablePhases((prev) =>
      prev.map((p) =>
        p.phaseNumber === phaseNumber ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSave = () => {
    // Calculate week ranges based on durations
    let weekStart = 1;
    const updates: Array<{
      id: TaperingPhaseId;
      dailyLimit: number;
      strengthMg: number;
      weekStart: number;
      weekEnd: number;
    }> = [];

    for (const phase of editablePhases) {
      const weekEnd = weekStart + phase.durationWeeks - 1;
      updates.push({
        id: phase.id,
        dailyLimit: phase.dailyLimit,
        strengthMg: phase.strengthMg,
        weekStart,
        weekEnd,
      });
      weekStart = weekEnd + 1;
    }

    // Also update Phase 5 to start after Phase 4
    if (phase5) {
      updates.push({
        id: phase5.id,
        dailyLimit: 0,
        strengthMg: 0,
        weekStart,
        weekEnd: weekStart + 999, // Ongoing
      });
    }

    onSave(updates);
    onClose();
  };

  const handleResetToDefault = () => {
    const defaultPhases = generateDefaultPlan(
      baselineDailyPouches,
      baselineStrengthMg
    );

    setEditablePhases((prev) =>
      prev.map((p) => {
        const defaultPhase = defaultPhases.find(
          (d) => d.phaseNumber === p.phaseNumber
        );
        if (defaultPhase) {
          return {
            ...p,
            dailyLimit: defaultPhase.dailyLimit,
            strengthMg: defaultPhase.strengthMg,
            durationWeeks: defaultPhase.durationWeeks,
          };
        }
        return p;
      })
    );
    setShowResetConfirm(false);
  };

  const handleFullReset = () => {
    onResetToDefault();
    onClose();
  };

  // Calculate total weeks
  const totalWeeks = editablePhases.reduce(
    (sum, p) => sum + p.durationWeeks,
    0
  );

  return (
    <div className="space-y-6 py-4">
      {/* Reset confirmation */}
      {showResetConfirm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">
            Reset plan to default values based on your baseline (
            {baselineDailyPouches} pouches/day, {baselineStrengthMg}mg)?
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 bg-amber-100 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900/50"
              onClick={handleResetToDefault}
            >
              Reset Values
            </Button>
            <Button variant="destructive" size="sm" onClick={handleFullReset}>
              Full Reset
            </Button>
          </div>
        </div>
      )}

      {/* Phase editors */}
      <div className="space-y-4">
        {editablePhases.map((phase) => (
          <div
            key={phase.phaseNumber}
            className="bg-card rounded-xl border p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">
                Phase {phase.phaseNumber}: {getPhaseLabel(phase.phaseNumber)}
              </h3>
              <span className="text-muted-foreground text-xs">
                {phase.durationWeeks} week{phase.durationWeeks !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Pouches/day</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={phase.dailyLimit}
                  onChange={(e) =>
                    updatePhase(
                      phase.phaseNumber,
                      "dailyLimit",
                      Math.max(0, parseInt(e.target.value) || 0)
                    )
                  }
                  className="mt-1 h-10"
                />
              </div>
              <div>
                <Label className="text-xs">Strength (mg)</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={phase.strengthMg}
                  onChange={(e) =>
                    updatePhase(
                      phase.phaseNumber,
                      "strengthMg",
                      Math.max(0, parseInt(e.target.value) || 0)
                    )
                  }
                  className="mt-1 h-10"
                />
              </div>
              <div>
                <Label className="text-xs">Weeks</Label>
                <Input
                  type="number"
                  min="1"
                  max="52"
                  value={phase.durationWeeks}
                  onChange={(e) =>
                    updatePhase(
                      phase.phaseNumber,
                      "durationWeeks",
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  className="mt-1 h-10"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Phase 5 (Freedom) - Read only */}
        <div className="bg-muted/30 rounded-xl border border-dashed p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary h-4 w-4" />
            <h3 className="font-medium">Phase 5: Freedom</h3>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Pouch-free! Starts after week {totalWeeks}.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-xl p-3 text-center">
        <p className="text-sm">
          Total journey: <span className="font-medium">{totalWeeks} weeks</span>{" "}
          to freedom
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setShowResetConfirm(true)}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button className="flex-1" onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Plan
        </Button>
      </div>
    </div>
  );
}

export function EditPlanSheet({
  open,
  onOpenChange,
  phases,
  baselineDailyPouches,
  baselineStrengthMg,
  onSave,
  onResetToDefault,
}: EditPlanSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle>Customize Your Plan</SheetTitle>
          <SheetDescription>
            Adjust each phase to match your pace. Your journey, your rules.
          </SheetDescription>
        </SheetHeader>

        {open && (
          <EditPlanForm
            key={phases
              .map((p) => `${p.id}-${p.dailyLimit}-${p.strengthMg}`)
              .join(",")}
            phases={phases}
            baselineDailyPouches={baselineDailyPouches}
            baselineStrengthMg={baselineStrengthMg}
            onSave={onSave}
            onResetToDefault={onResetToDefault}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
