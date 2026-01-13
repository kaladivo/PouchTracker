"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboarding, StepIndicator } from "@/components/onboarding";
import { ArrowLeft, ArrowRight, Plus, X, Check } from "lucide-react";

const presetStrengths = [
  { brand: "ZYN", strengths: [3, 6, 9, 11, 12.5, 16.5] },
  { brand: "VELO", strengths: [4, 6, 7, 10, 14, 17] },
  { brand: "On!", strengths: [2, 4, 6, 8, 9] },
  { brand: "Lucy", strengths: [4, 8, 12] },
  { brand: "Rogue", strengths: [3, 6] },
  { brand: "Kurwa", strengths: [14, 18, 33] },
];

export default function StrengthsPage() {
  const router = useRouter();
  const { data, updateData, totalSteps, setCurrentStep } = useOnboarding();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customBrand, setCustomBrand] = useState("");
  const [customStrength, setCustomStrength] = useState("");

  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  const addCustomStrength = () => {
    if (customBrand && customStrength) {
      updateData({
        customStrengths: [
          ...data.customStrengths,
          { brand: customBrand, strengthMg: parseInt(customStrength) },
        ],
      });
      setCustomBrand("");
      setCustomStrength("");
      setShowCustomForm(false);
    }
  };

  const removeCustomStrength = (index: number) => {
    updateData({
      customStrengths: data.customStrengths.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/onboarding/usage")}
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <StepIndicator
          currentStep={3}
          totalSteps={totalSteps}
          className="mb-4"
        />
        <h1 className="text-2xl font-semibold">Pouch Strengths</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          We support common brands. Add custom ones if needed.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Preset Brands - Informational */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check className="text-primary h-4 w-4" />
            <Label className="text-primary">Already supported brands</Label>
          </div>
          <p className="text-muted-foreground -mt-1 text-xs">
            These brands are built-in. Just continue if you use one of these.
          </p>
          <div className="bg-card space-y-0 rounded-xl p-3">
            {presetStrengths.map((brand, index) => (
              <div
                key={brand.brand}
                className={`flex items-center justify-between px-1 py-2.5 ${
                  index !== presetStrengths.length - 1
                    ? "border-border border-b"
                    : ""
                }`}
              >
                <span className="text-sm font-medium">{brand.brand}</span>
                <span className="text-muted-foreground text-xs">
                  {brand.strengths.join(", ")} mg
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Strengths */}
        <div className="space-y-3">
          <Label>Using a different brand?</Label>
          <p className="text-muted-foreground -mt-1 text-xs">
            Add your brand below if it&apos;s not listed above.
          </p>

          {data.customStrengths.length > 0 && (
            <div className="space-y-2">
              {data.customStrengths.map((custom, index) => (
                <div
                  key={index}
                  className="bg-primary/10 flex items-center justify-between rounded-xl p-3"
                >
                  <span className="text-sm font-medium">{custom.brand}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">
                      {custom.strengthMg} mg
                    </span>
                    <button
                      onClick={() => removeCustomStrength(index)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showCustomForm ? (
            <div className="bg-card space-y-4 rounded-xl p-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand name</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Custom Brand"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength">Strength (mg)</Label>
                <Input
                  id="strength"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g., 6"
                  value={customStrength}
                  onChange={(e) => setCustomStrength(e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCustomForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={!customBrand || !customStrength}
                  onClick={addCustomStrength}
                >
                  Add
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="bg-card w-full"
              onClick={() => setShowCustomForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Strength
            </Button>
          )}
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-6">
        <Button
          size="lg"
          className="h-14 w-full"
          onClick={() => router.push("/onboarding/schedule")}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-muted-foreground mt-2 text-center text-xs">
          You can always add more strengths later in settings
        </p>
      </div>
    </div>
  );
}
