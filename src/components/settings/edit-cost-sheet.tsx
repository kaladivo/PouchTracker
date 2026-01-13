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

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
];

interface EditCostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCurrency: string;
  currentPricePerCan: number | null; // in cents
  currentPouchesPerCan: number;
  onSave: (
    currency: string,
    pricePerCan: number | null,
    pouchesPerCan: number
  ) => void;
}

function EditCostForm({
  currentCurrency,
  currentPricePerCan,
  currentPouchesPerCan,
  onSave,
  onClose,
}: {
  currentCurrency: string;
  currentPricePerCan: number | null;
  currentPouchesPerCan: number;
  onSave: (
    currency: string,
    pricePerCan: number | null,
    pouchesPerCan: number
  ) => void;
  onClose: () => void;
}) {
  const [currency, setCurrency] = useState(currentCurrency);
  const [price, setPrice] = useState(
    currentPricePerCan ? (currentPricePerCan / 100).toString() : ""
  );
  const [pouchesPerCan, setPouchesPerCan] = useState(
    currentPouchesPerCan.toString()
  );

  const handleSave = () => {
    const priceInCents = price ? Math.round(parseFloat(price) * 100) : null;
    const pouches = parseInt(pouchesPerCan, 10) || 20;
    onSave(currency, priceInCents, pouches);
    onClose();
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find((c) => c.code === code)?.symbol ?? "$";
  };

  return (
    <div className="space-y-6 py-6">
      {/* Currency Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium">Currency</label>
        <div className="grid grid-cols-5 gap-2">
          {CURRENCIES.map((curr) => (
            <button
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={`rounded-xl px-2 py-2 text-center text-sm transition-all ${
                currency === curr.code
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border-input hover:bg-muted border"
              }`}
            >
              {curr.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Price per Can */}
      <div>
        <label className="mb-2 block text-sm font-medium">Price per Can</label>
        <div className="relative">
          <span className="text-muted-foreground absolute top-1/2 left-4 -translate-y-1/2">
            {getCurrencySymbol(currency)}
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="bg-card border-input focus:ring-ring w-full rounded-xl border py-3 pr-4 pl-10 focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Pouches per Can */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Pouches per Can
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[15, 20, 24, 30].map((num) => (
            <button
              key={num}
              onClick={() => setPouchesPerCan(num.toString())}
              className={`rounded-xl px-2 py-2 text-center text-sm transition-all ${
                parseInt(pouchesPerCan, 10) === num
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border-input hover:bg-muted border"
              }`}
            >
              {num}
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

export function EditCostSheet({
  open,
  onOpenChange,
  currentCurrency,
  currentPricePerCan,
  currentPouchesPerCan,
  onSave,
}: EditCostSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>Cost Tracking</SheetTitle>
          <SheetDescription>
            Track how much you&apos;re saving on your journey
          </SheetDescription>
        </SheetHeader>

        {open && (
          <EditCostForm
            key={`${currentCurrency}-${currentPricePerCan}-${currentPouchesPerCan}`}
            currentCurrency={currentCurrency}
            currentPricePerCan={currentPricePerCan}
            currentPouchesPerCan={currentPouchesPerCan}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
