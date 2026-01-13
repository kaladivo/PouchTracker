"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboarding, StepIndicator } from "@/components/onboarding";
import { ArrowLeft, ArrowRight, TrendingDown } from "lucide-react";

const currencies = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "CZK", symbol: "Kč", label: "Czech Koruna" },
  { code: "SEK", symbol: "kr", label: "Swedish Krona" },
];

export default function CostPage() {
  const router = useRouter();
  const { data, updateData, totalSteps, setCurrentStep } = useOnboarding();

  useEffect(() => {
    setCurrentStep(5);
  }, [setCurrentStep]);

  const selectedCurrency = currencies.find((c) => c.code === data.currency);

  // Calculate estimated savings
  const calculateMonthlySavings = () => {
    if (!data.pricePerCan || !data.currentPouchesPerDay) return null;

    const pouchesPerMonth = data.currentPouchesPerDay * 30;
    const cansPerMonth = pouchesPerMonth / data.pouchesPerCan;
    const monthlyCost = cansPerMonth * data.pricePerCan;

    // Assuming 50% reduction over time
    const savings = monthlyCost * 0.5;
    return savings.toFixed(0);
  };

  const monthlySavings = calculateMonthlySavings();

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/onboarding/schedule")}
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <StepIndicator
          currentStep={5}
          totalSteps={totalSteps}
          className="mb-4"
        />
        <h1 className="text-2xl font-semibold">Cost Tracking</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          See how much you&apos;ll save on your journey
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6">
        {/* Currency Selection */}
        <div className="space-y-3">
          <Label>Currency</Label>
          <div className="grid grid-cols-5 gap-2">
            {currencies.map((currency) => (
              <Card
                key={currency.code}
                className={`cursor-pointer transition-all ${
                  data.currency === currency.code
                    ? "ring-primary bg-primary/5 ring-2"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => updateData({ currency: currency.code })}
              >
                <CardContent className="p-2 text-center">
                  <span
                    className={`text-sm font-medium ${
                      data.currency === currency.code ? "text-primary" : ""
                    }`}
                  >
                    {currency.symbol}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Price per can */}
        <div className="space-y-3">
          <Label htmlFor="price">Price per can/pack</Label>
          <div className="relative">
            <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
              {selectedCurrency?.symbol}
            </span>
            <Input
              id="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="5.99"
              value={data.pricePerCan ?? ""}
              onChange={(e) =>
                updateData({
                  pricePerCan: e.target.value
                    ? parseFloat(e.target.value)
                    : null,
                })
              }
              className="bg-card h-12 pl-8 text-lg"
            />
          </div>
        </div>

        {/* Pouches per can */}
        <div className="space-y-3">
          <Label htmlFor="count">Pouches per can/pack</Label>
          <Input
            id="count"
            type="number"
            inputMode="numeric"
            placeholder="20"
            value={data.pouchesPerCan}
            onChange={(e) =>
              updateData({
                pouchesPerCan: e.target.value ? parseInt(e.target.value) : 20,
              })
            }
            className="bg-card h-12 text-lg"
          />
          <p className="text-muted-foreground text-xs">
            Most cans have 15-24 pouches
          </p>
        </div>

        {/* Savings Preview */}
        {monthlySavings && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                  <TrendingDown className="text-primary h-6 w-6" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Potential monthly savings
                  </p>
                  <p className="text-primary text-2xl font-semibold">
                    {selectedCurrency?.symbol}
                    {monthlySavings}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Based on reducing usage by 50%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Continue Button */}
      <div className="pt-6">
        <Button
          size="lg"
          className="h-14 w-full"
          onClick={() => router.push("/onboarding/preview")}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <button
          onClick={() => router.push("/onboarding/preview")}
          className="text-muted-foreground hover:text-foreground mt-3 w-full text-sm"
        >
          Skip cost tracking
        </button>
      </div>
    </div>
  );
}
