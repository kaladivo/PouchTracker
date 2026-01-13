"use client";

import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Check, Monitor, Moon, Sun } from "lucide-react";

interface ThemeToggleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const themes = [
  {
    value: "system",
    label: "System",
    description: "Match your device settings",
    icon: Monitor,
  },
  {
    value: "light",
    label: "Light",
    description: "Bright and fresh",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Easy on the eyes",
    icon: Moon,
  },
];

export function ThemeToggleSheet({
  open,
  onOpenChange,
}: ThemeToggleSheetProps) {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>Theme</SheetTitle>
          <SheetDescription>Choose your preferred appearance</SheetDescription>
        </SheetHeader>

        <div className="space-y-2 py-6">
          {themes.map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.value;

            return (
              <button
                key={t.value}
                onClick={() => handleThemeChange(t.value)}
                className={`flex w-full items-center gap-4 rounded-xl p-4 transition-all ${
                  isSelected
                    ? "bg-primary/10 ring-primary ring-2"
                    : "bg-card hover:bg-muted"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isSelected ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{t.label}</p>
                  <p className="text-muted-foreground text-sm">
                    {t.description}
                  </p>
                </div>
                {isSelected && <Check className="text-primary h-5 w-5" />}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
