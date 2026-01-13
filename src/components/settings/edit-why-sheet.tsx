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
import { Heart } from "lucide-react";

interface EditWhySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWhy: string | null;
  onSave: (personalWhy: string) => void;
}

function EditWhyForm({
  currentWhy,
  onSave,
  onClose,
}: {
  currentWhy: string | null;
  onSave: (personalWhy: string) => void;
  onClose: () => void;
}) {
  const [personalWhy, setPersonalWhy] = useState(currentWhy ?? "");

  const handleSave = () => {
    onSave(personalWhy);
    onClose();
  };

  const suggestions = [
    "My health and longevity",
    "Saving money for things I love",
    "Being present for my family",
    "Breaking free from dependency",
    "Feeling in control of my life",
  ];

  return (
    <div className="space-y-6 py-6">
      <textarea
        placeholder="e.g., I want to be healthier for my kids..."
        value={personalWhy}
        onChange={(e) => setPersonalWhy(e.target.value)}
        rows={3}
        maxLength={200}
        className="bg-card border-input focus:ring-ring w-full resize-none rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
      />

      <div>
        <p className="text-muted-foreground mb-2 text-xs">Quick suggestions:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setPersonalWhy(suggestion)}
              className="bg-muted hover:bg-muted/80 rounded-full px-3 py-1.5 text-xs transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <Button className="h-12 w-full" onClick={handleSave}>
        Save
      </Button>
    </div>
  );
}

export function EditWhySheet({
  open,
  onOpenChange,
  currentWhy,
  onSave,
}: EditWhySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Heart className="text-primary h-5 w-5" />
            Your Why
          </SheetTitle>
          <SheetDescription>
            What motivates you on this journey? This will appear when you need
            encouragement.
          </SheetDescription>
        </SheetHeader>

        {open && (
          <EditWhyForm
            key={currentWhy}
            currentWhy={currentWhy}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
