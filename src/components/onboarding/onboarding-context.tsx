"use client";

import { createContext, useContext, useState, useCallback } from "react";

export interface OnboardingData {
  // Step 2: Current usage
  currentPouchesPerDay: number | null;
  currentStrengthMg: number | null;
  yearsUsing: number | null;

  // Step 3: Custom strengths
  customStrengths: Array<{ brand: string; strengthMg: number }>;

  // Step 4: Schedule
  wakeTime: string; // "HH:MM" format
  sleepTime: string;

  // Step 5: Cost tracking
  currency: string;
  pricePerCan: number | null;
  pouchesPerCan: number;

  // Step 6: Generated plan preview
  personalWhy: string;
}

const defaultData: OnboardingData = {
  currentPouchesPerDay: null,
  currentStrengthMg: null,
  yearsUsing: null,
  customStrengths: [],
  wakeTime: "07:00",
  sleepTime: "23:00",
  currency: "USD",
  pricePerCan: null,
  pouchesPerCan: 20,
  personalWhy: "",
};

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetData = useCallback(() => {
    setData(defaultData);
    setCurrentStep(1);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateData,
        resetData,
        currentStep,
        setCurrentStep,
        totalSteps,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
