"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Leaf, Heart, Coffee, Mail, ChevronRight } from "lucide-react";
import { ImportDataSheet } from "@/components/onboarding";

export default function WelcomePage() {
  const router = useRouter();
  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      {/* Logo/Icon */}
      <div className="bg-primary/10 mb-8 flex h-24 w-24 items-center justify-center rounded-full">
        <Leaf className="text-primary h-12 w-12" />
      </div>

      {/* Welcome Text */}
      <h1 className="mb-3 text-3xl font-semibold">Welcome to PouchTracker</h1>
      <p className="text-muted-foreground mb-2 text-lg">
        Your compassionate companion for quitting nicotine pouches
      </p>
      <p className="text-muted-foreground mb-6 max-w-xs text-sm">
        We&apos;ll help you gradually reduce your usage at a pace that works for
        you. No judgment, just support.
      </p>

      {/* Free Forever Banner */}
      <button
        onClick={() => setAboutOpen(true)}
        className="bg-primary/5 border-primary/20 hover:bg-primary/10 mb-8 flex items-center gap-2 rounded-full border px-4 py-2 transition-colors"
      >
        <Heart className="text-primary h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">
          100% Free Forever — No Ads, No Subscriptions
        </span>
        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
      </button>

      {/* Features Preview */}
      <div className="mb-12 w-full space-y-3">
        {[
          "Personalized tapering plan",
          "Track your progress & savings",
          "Craving support when you need it",
          "Celebrate your achievements",
        ].map((feature) => (
          <div
            key={feature}
            className="bg-muted/50 flex items-center gap-3 rounded-lg px-4 py-3 text-left"
          >
            <div className="bg-primary h-2 w-2 shrink-0 rounded-full" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button
        size="lg"
        className="h-14 w-full text-lg"
        onClick={() => router.push("/onboarding/usage")}
      >
        Let&apos;s Get Started
      </Button>

      <p className="text-muted-foreground mt-4 text-xs">
        Takes about 2 minutes to set up
      </p>

      <button
        onClick={() => setImportSheetOpen(true)}
        className="text-primary mt-6 text-sm underline"
      >
        Import existing data
      </button>

      <ImportDataSheet
        open={importSheetOpen}
        onOpenChange={setImportSheetOpen}
      />

      {/* About Dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>About PouchTracker</DialogTitle>
            <DialogDescription>Version 1.0.0</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                I built this app for myself first — to help track and reduce my
                nicotine pouch usage. After seeing how much it helped, I decided
                to share it with others who might be on the same journey.
              </p>
              <p className="text-muted-foreground text-sm">
                This is a passion project and it will always be{" "}
                <span className="font-medium">completely free</span>. I
                don&apos;t want to make money from it — I just want to help
                others who are going through the same thing.
              </p>
              <p className="text-muted-foreground text-sm">
                If you find it helpful and want to support the development costs
                (AI tools and hosting), you can buy me a coffee. But it&apos;s
                totally optional!
              </p>
            </div>

            <Button
              variant="outline"
              className="h-10 w-full"
              onClick={() =>
                window.open("https://buymeacoffee.com/davenov", "_blank")
              }
            >
              <Coffee className="mr-2 h-4 w-4" />
              Buy me a coffee
            </Button>

            <div className="border-t pt-3">
              <p className="text-muted-foreground mb-2 text-sm">
                Have feedback or suggestions? I&apos;d love to hear from you!
              </p>
              <Button
                variant="ghost"
                className="h-9 w-full"
                onClick={() =>
                  (window.location.href = "mailto:mail@davenov.com")
                }
              >
                <Mail className="mr-2 h-4 w-4" />
                mail@davenov.com
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
