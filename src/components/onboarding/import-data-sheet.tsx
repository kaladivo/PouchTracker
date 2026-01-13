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
import { Loader2 } from "lucide-react";
import { evolu } from "@/lib/evolu/schema";
import { Mnemonic } from "@evolu/common";

interface ImportDataSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDataSheet({ open, onOpenChange }: ImportDataSheetProps) {
  const [mnemonic, setMnemonic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);
    setLoading(true);

    const result = Mnemonic.from(mnemonic.trim());
    if (!result.ok) {
      setError("Invalid recovery phrase. Please check and try again.");
      setLoading(false);
      return;
    }

    try {
      await evolu.restoreAppOwner(result.value);
      // App will reload automatically
    } catch {
      setError("Failed to import. Please try again.");
      setLoading(false);
    }
  };

  // Reset state when sheet closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setMnemonic("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>Import Existing Data</SheetTitle>
          <SheetDescription>
            Enter your recovery phrase to restore your data from another device.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div>
            <label className="text-sm font-medium">Recovery Phrase</label>
            <textarea
              placeholder="Enter your 12 or 24 word recovery phrase..."
              value={mnemonic}
              onChange={(e) => {
                setMnemonic(e.target.value);
                setError(null);
              }}
              rows={4}
              disabled={loading}
              className="bg-card border-input focus:ring-ring mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <Button
            className="h-12 w-full"
            onClick={handleImport}
            disabled={!mnemonic.trim() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>

          {/* Footer */}
          <p className="text-muted-foreground pt-4 text-center text-xs">
            Powered by{" "}
            <a
              href="https://evolu.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Evolu
            </a>{" "}
            - your data stays yours
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
