"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Cloud, Key, Copy, Download, Loader2, Check } from "lucide-react";
import { evolu } from "@/lib/evolu/schema";
import { Mnemonic } from "@evolu/common";
import { localAuth } from "@evolu/react-web";
import { toast } from "sonner";
import type { AppOwner } from "@evolu/common";

interface BackupSyncSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type View = "main" | "import";

function MainView({
  appOwner,
  onImportClick,
  onClose,
}: {
  appOwner: AppOwner | null;
  onImportClick: () => void;
  onClose: () => void;
}) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySuccess, setPasskeySuccess] = useState(false);

  const handleCopyMnemonic = async () => {
    if (!appOwner?.mnemonic) return;

    try {
      await navigator.clipboard.writeText(appOwner.mnemonic);
      setCopySuccess(true);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleAddPasskey = async () => {
    if (!appOwner?.mnemonic) return;

    setPasskeyLoading(true);
    try {
      const username = `pouchtracker-${Date.now()}`;
      const result = await localAuth.register(username, {
        service: "pouchtracker",
        mnemonic: appOwner.mnemonic,
      });

      if (result) {
        setPasskeySuccess(true);
        setTimeout(() => {
          evolu.reloadApp();
        }, 500);
      } else {
        toast.error("Failed to register passkey");
      }
    } catch {
      toast.error("Passkey registration failed");
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Passkey Button */}
      <Button
        variant="outline"
        className="h-14 w-full justify-start gap-3"
        onClick={handleAddPasskey}
        disabled={passkeyLoading || !appOwner}
      >
        {passkeyLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : passkeySuccess ? (
          <Check className="text-primary h-5 w-5" />
        ) : (
          <Key className="h-5 w-5" />
        )}
        <div className="text-left">
          <p className="font-medium">Add Passkey</p>
          <p className="text-muted-foreground text-xs">
            Quick access on this device
          </p>
        </div>
      </Button>

      {/* Copy Recovery Phrase Button */}
      <Button
        variant="outline"
        className="h-14 w-full justify-start gap-3"
        onClick={handleCopyMnemonic}
        disabled={!appOwner}
      >
        {copySuccess ? (
          <Check className="text-primary h-5 w-5" />
        ) : (
          <Copy className="h-5 w-5" />
        )}
        <div className="text-left">
          <p className="font-medium">Copy Recovery Phrase</p>
          <p className="text-muted-foreground text-xs">
            Save to restore on any device
          </p>
        </div>
      </Button>

      {/* Import Recovery Phrase Button */}
      <Button
        variant="outline"
        className="h-14 w-full justify-start gap-3"
        onClick={onImportClick}
      >
        <Download className="h-5 w-5" />
        <div className="text-left">
          <p className="font-medium">Import Recovery Phrase</p>
          <p className="text-muted-foreground text-xs">
            Restore from another device
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

function ImportView({ onBack }: { onBack: () => void }) {
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

export function BackupSyncSheet({ open, onOpenChange }: BackupSyncSheetProps) {
  const [view, setView] = useState<View>("main");
  const [appOwner, setAppOwner] = useState<AppOwner | null>(null);

  // Load app owner when sheet opens
  useEffect(() => {
    if (open) {
      evolu.appOwner.then(setAppOwner);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Reset view when sheet closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setView("main");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Cloud className="text-primary h-5 w-5" />
            Backup & Sync
          </SheetTitle>
          <SheetDescription>
            Keep your progress safe. Use a passkey for easy access on this
            device, or save your recovery phrase to restore on any device.
          </SheetDescription>
        </SheetHeader>

        {view === "main" ? (
          <MainView
            appOwner={appOwner}
            onImportClick={() => setView("import")}
            onClose={handleClose}
          />
        ) : (
          <ImportView onBack={() => setView("main")} />
        )}
      </SheetContent>
    </Sheet>
  );
}
