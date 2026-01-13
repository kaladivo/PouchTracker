"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboarding, StepIndicator } from "@/components/onboarding";
import { ArrowLeft, ArrowRight, Sun, Moon } from "lucide-react";

export default function SchedulePage() {
  const router = useRouter();
  const { data, updateData, totalSteps, setCurrentStep } = useOnboarding();

  useEffect(() => {
    setCurrentStep(4);
  }, [setCurrentStep]);

  // Calculate awake hours
  const getAwakeHours = () => {
    const [wakeH, wakeM] = data.wakeTime.split(":").map(Number);
    const [sleepH, sleepM] = data.sleepTime.split(":").map(Number);

    const wakeMinutes = wakeH * 60 + wakeM;
    let sleepMinutes = sleepH * 60 + sleepM;

    // Handle crossing midnight
    if (sleepMinutes <= wakeMinutes) {
      sleepMinutes += 24 * 60;
    }

    const awakeMinutes = sleepMinutes - wakeMinutes;
    const hours = Math.floor(awakeMinutes / 60);
    const mins = awakeMinutes % 60;

    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/onboarding/strengths")}
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <StepIndicator
          currentStep={4}
          totalSteps={totalSteps}
          className="mb-4"
        />
        <h1 className="text-2xl font-semibold">Your Schedule</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          We&apos;ll pause the timer while you sleep
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6">
        {/* Wake Time */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="bg-secondary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                <Sun className="text-secondary h-6 w-6" />
              </div>
              <div className="flex-1">
                <Label htmlFor="wake" className="text-base font-medium">
                  Wake up time
                </Label>
                <p className="text-muted-foreground text-xs">
                  When do you usually start your day?
                </p>
              </div>
              <Input
                id="wake"
                type="time"
                value={data.wakeTime}
                onChange={(e) => updateData({ wakeTime: e.target.value })}
                className="bg-muted/50 w-28 text-center"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sleep Time */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                <Moon className="text-muted-foreground h-6 w-6" />
              </div>
              <div className="flex-1">
                <Label htmlFor="sleep" className="text-base font-medium">
                  Bedtime
                </Label>
                <p className="text-muted-foreground text-xs">
                  When do you usually go to sleep?
                </p>
              </div>
              <Input
                id="sleep"
                type="time"
                value={data.sleepTime}
                onChange={(e) => updateData({ sleepTime: e.target.value })}
                className="bg-muted/50 w-28 text-center"
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-sm">Awake hours</p>
            <p className="text-primary text-2xl font-semibold">
              {getAwakeHours()}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Your pouches will be spaced throughout this time
            </p>
          </CardContent>
        </Card>

        {/* Explanation */}
        <div className="text-muted-foreground space-y-2 px-2 text-sm">
          <p>
            <strong className="text-foreground">Why does this matter?</strong>
          </p>
          <p>
            Your timer pauses during sleep hours so you won&apos;t wake up with
            hours of &quot;unused&quot; time. The interval between pouches is
            calculated based on your waking hours.
          </p>
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-6">
        <Button
          size="lg"
          className="h-14 w-full"
          onClick={() => router.push("/onboarding/cost")}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
