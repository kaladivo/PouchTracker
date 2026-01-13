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
import { AlertTriangle, Archive, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteDataSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchiveAndDelete: () => void;
  onDeleteOnly: () => void;
  journeyStats: {
    totalDays: number;
    totalLogs: number;
    currentPhase: number;
  };
}

export function DeleteDataSheet({
  open,
  onOpenChange,
  onArchiveAndDelete,
  onDeleteOnly,
  journeyStats,
}: DeleteDataSheetProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmStep, setConfirmStep] = useState<"initial" | "confirm">(
    "initial"
  );

  const handleArchiveAndDelete = async () => {
    setIsProcessing(true);
    try {
      onArchiveAndDelete();
      toast.success("Journey archived and data cleared", {
        description:
          "Your journey has been saved. You can start fresh anytime.",
      });
      onOpenChange(false);
      setConfirmStep("initial");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteOnly = async () => {
    setIsProcessing(true);
    try {
      onDeleteOnly();
      toast.success("Data cleared", {
        description: "All data has been deleted. You can start fresh.",
      });
      onOpenChange(false);
      setConfirmStep("initial");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setConfirmStep("initial");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete All Data
          </SheetTitle>
          <SheetDescription>
            This action will clear all your logs, reflections, and progress.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {/* Journey Summary */}
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm font-medium">Your current journey:</p>
            <div className="mt-2 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-primary text-lg font-semibold">
                  {journeyStats.totalDays}
                </p>
                <p className="text-muted-foreground text-xs">Days</p>
              </div>
              <div>
                <p className="text-primary text-lg font-semibold">
                  {journeyStats.totalLogs}
                </p>
                <p className="text-muted-foreground text-xs">Logs</p>
              </div>
              <div>
                <p className="text-primary text-lg font-semibold">
                  {journeyStats.currentPhase}
                </p>
                <p className="text-muted-foreground text-xs">Phase</p>
              </div>
            </div>
          </div>

          {confirmStep === "initial" ? (
            <>
              <p className="text-muted-foreground text-sm">
                You can archive your journey data before deleting, so you can
                look back on your progress in the future.
              </p>

              <div className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setConfirmStep("confirm")}
                  disabled={isProcessing}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive and Clear Data
                  <span className="text-muted-foreground ml-auto text-xs">
                    Recommended
                  </span>
                </Button>

                <Button
                  className="text-destructive hover:text-destructive w-full justify-start"
                  variant="outline"
                  onClick={handleDeleteOnly}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete Without Archiving
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="border-primary/20 bg-primary/5 rounded-xl border p-4">
                <p className="text-sm">
                  Your journey will be archived and you&apos;ll be able to view
                  it in your archives. All current data will be cleared so you
                  can start fresh.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmStep("initial")}
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleArchiveAndDelete}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  Archive & Clear
                </Button>
              </div>
            </>
          )}

          <Button variant="ghost" className="w-full" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
