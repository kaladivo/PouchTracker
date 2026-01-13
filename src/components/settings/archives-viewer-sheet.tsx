"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Archive, Calendar, Target, TrendingUp } from "lucide-react";

interface JourneyArchive {
  id: string;
  archivedAt: string | null;
  finalPhase: number | null;
  totalDays: number | null;
  dataSnapshot: string | null;
}

interface ArchivesViewerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archives: readonly JourneyArchive[];
}

function getPhaseLabel(phase: number): string {
  const labels = ["Awareness", "Reducing", "Lowering", "Minimal", "Freedom"];
  return labels[phase - 1] || `Phase ${phase}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown date";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ArchivesViewerSheet({
  open,
  onOpenChange,
  archives,
}: ArchivesViewerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[80vh] overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Archive className="text-primary h-5 w-5" />
            Journey Archives
          </SheetTitle>
          <SheetDescription>
            Your previous quit attempts - each one taught you something
            valuable.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {archives.length === 0 ? (
            <div className="py-8 text-center">
              <div className="bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                <Archive className="text-muted-foreground h-6 w-6" />
              </div>
              <p className="text-muted-foreground mt-4 text-sm">
                No archived journeys yet.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                When you reset your data, your journey will be saved here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {archives.map((archive, index) => (
                <Card key={archive.id} className="overflow-hidden">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                        <span className="text-primary text-sm font-semibold">
                          {archives.length - index}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-muted-foreground h-3 w-3" />
                          <p className="text-muted-foreground text-xs">
                            Archived {formatDate(archive.archivedAt)}
                          </p>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="text-primary h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">
                                {archive.totalDays ?? 0} days
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Journey length
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="text-primary h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">
                                {getPhaseLabel(archive.finalPhase ?? 1)}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Final phase
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {archives.length > 0 && (
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <p className="text-muted-foreground text-sm">
                You&apos;ve attempted {archives.length}{" "}
                {archives.length === 1 ? "journey" : "journeys"}. Each attempt
                is progress - you&apos;re learning what works for you.
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
