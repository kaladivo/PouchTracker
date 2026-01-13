"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboarding, StepIndicator } from "@/components/onboarding";
import { ArrowLeft, ArrowRight } from "lucide-react";

const strengthOptions = [
  { label: "2mg", value: 2 },
  { label: "4mg", value: 4 },
  { label: "6mg", value: 6 },
  { label: "8mg", value: 8 },
  { label: "10mg", value: 10 },
];

export default function UsagePage() {
  const router = useRouter();
  const { data, updateData, totalSteps, setCurrentStep } = useOnboarding();
  // Track if user explicitly selected custom mode (not derived from data)
  const [customModeActive, setCustomModeActive] = useState(false);
  const [customStrengthInput, setCustomStrengthInput] = useState("");

  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Determine if we're in custom mode: either explicitly activated or value is non-preset
  const isPresetValue =
    data.currentStrengthMg !== null &&
    strengthOptions.some((opt) => opt.value === data.currentStrengthMg);
  const isCustomStrength =
    customModeActive || (!isPresetValue && data.currentStrengthMg !== null);

  const handlePresetStrength = (value: number) => {
    setCustomModeActive(false);
    setCustomStrengthInput("");
    updateData({ currentStrengthMg: value });
  };

  const handleCustomToggle = () => {
    setCustomModeActive(true);
    setCustomStrengthInput("");
    updateData({ currentStrengthMg: null });
  };

  const handleCustomStrengthChange = (value: string) => {
    setCustomStrengthInput(value);
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0) {
      updateData({ currentStrengthMg: parsed });
    } else {
      updateData({ currentStrengthMg: null });
    }
  };

  const canContinue =
    data.currentPouchesPerDay !== null && data.currentStrengthMg !== null;

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/onboarding")}
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <StepIndicator
          currentStep={2}
          totalSteps={totalSteps}
          className="mb-4"
        />
        <h1 className="text-2xl font-semibold">Current Usage</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Let&apos;s understand where you&apos;re starting from
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-6">
        {/* Pouches per day */}
        <div className="space-y-3">
          <Label htmlFor="pouches">How many pouches do you use per day?</Label>
          <Input
            id="pouches"
            type="number"
            inputMode="numeric"
            placeholder="e.g., 10"
            min={1}
            max={50}
            value={data.currentPouchesPerDay ?? ""}
            onChange={(e) =>
              updateData({
                currentPouchesPerDay: e.target.value
                  ? parseInt(e.target.value)
                  : null,
              })
            }
            className="bg-card h-12 text-lg"
          />
          <p className="text-muted-foreground text-xs">
            Be honest - this helps us create a realistic plan
          </p>
        </div>

        {/* Strength */}
        <div className="space-y-3">
          <Label>What strength do you typically use?</Label>
          <div className="grid grid-cols-3 gap-2">
            {strengthOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-xl px-2 py-4 text-sm font-medium transition-all ${
                  !isCustomStrength && data.currentStrengthMg === option.value
                    ? "bg-primary/15 text-primary ring-primary ring-2"
                    : "bg-card hover:bg-muted text-foreground"
                }`}
                onClick={() => handlePresetStrength(option.value)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              className={`rounded-xl px-2 py-4 text-sm font-medium transition-all ${
                isCustomStrength
                  ? "bg-primary/15 text-primary ring-primary ring-2"
                  : "bg-card hover:bg-muted text-foreground"
              }`}
              onClick={handleCustomToggle}
            >
              Custom
            </button>
          </div>
          {isCustomStrength && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Enter mg"
                min={1}
                max={50}
                value={customStrengthInput}
                onChange={(e) => handleCustomStrengthChange(e.target.value)}
                className="bg-card h-12 w-32 text-lg"
                autoFocus
              />
              <span className="text-muted-foreground">mg</span>
            </div>
          )}
        </div>

        {/* Years using (optional) */}
        <div className="space-y-3">
          <Label htmlFor="years">
            How long have you been using nicotine pouches?
            <span className="text-muted-foreground ml-1 font-normal">
              (optional)
            </span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="years"
              type="number"
              inputMode="numeric"
              placeholder="e.g., 2"
              min={0}
              max={30}
              value={data.yearsUsing ?? ""}
              onChange={(e) =>
                updateData({
                  yearsUsing: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="bg-card h-12 w-24 text-lg"
            />
            <span className="text-muted-foreground">years</span>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-6">
        <Button
          size="lg"
          className="h-14 w-full"
          disabled={!canContinue}
          onClick={() => router.push("/onboarding/strengths")}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
