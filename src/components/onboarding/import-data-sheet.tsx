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
import { Key, FileText, Loader2 } from "lucide-react";
import { evolu } from "@/lib/evolu/schema";
import { Mnemonic } from "@evolu/common";
import { localAuth } from "@evolu/react-web";

interface ImportDataSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type View = "main" | "mnemonic";

function MainView({ onMnemonicClick }: { onMnemonicClick: () => void }) {
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    try {
      // Get profiles to find existing owner
      const profiles = await localAuth.getProfiles({
        service: "pouchtracker",
      });

      if (profiles.length === 0) {
        // No passkey found - silent fallback, just stop loading
        setPasskeyLoading(false);
        return;
      }

      // Try to login with the first profile
      const result = await localAuth.login(profiles[0].ownerId, {
        service: "pouchtracker",
      });

      if (result) {
        evolu.reloadApp();
      } else {
        // Silent fallback
        setPasskeyLoading(false);
      }
    } catch {
      // Silent fallback
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Passkey Button */}
      <Button
        variant="outline"
        className="h-14 w-full justify-start gap-3"
        onClick={handlePasskeyLogin}
        disabled={passkeyLoading}
      >
        {passkeyLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Key className="h-5 w-5" />
        )}
        <div className="text-left">
          <p className="font-medium">Use Passkey</p>
          <p className="text-muted-foreground text-xs">
            Quick import if you set up a passkey
          </p>
        </div>
      </Button>

      {/* Mnemonic Button */}
      <Button
        variant="outline"
        className="h-14 w-full justify-start gap-3"
        onClick={onMnemonicClick}
      >
        <FileText className="h-5 w-5" />
        <div className="text-left">
          <p className="font-medium">Enter Recovery Phrase</p>
          <p className="text-muted-foreground text-xs">
            Restore with your 12 or 24 word phrase
          </p>
        </div>
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
  );
}

function MnemonicView({ onBack }: { onBack: () => void }) {
  const [mnemonic, setMnemonic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);
    setLoading(true);

    const result = Mnemonic.from(mnemonic.trim());
    if (!result.ok) {
      // Silent fallback - just clear and allow retry
      setLoading(false);
      return;
    }

    try {
      await evolu.restoreAppOwner(result.value);
      // App will reload automatically
    } catch {
      // Silent fallback
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={onBack}
        disabled={loading}
      >
        &larr; Back
      </Button>

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
  );
}

export function ImportDataSheet({ open, onOpenChange }: ImportDataSheetProps) {
  const [view, setView] = useState<View>("main");

  // Reset view when sheet closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setView("main");
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>Import Existing Data</SheetTitle>
          <SheetDescription>
            Import your data from another device.
          </SheetDescription>
        </SheetHeader>

        {view === "main" ? (
          <MainView onMnemonicClick={() => setView("mnemonic")} />
        ) : (
          <MnemonicView onBack={() => setView("main")} />
        )}
      </SheetContent>
    </Sheet>
  );
}
