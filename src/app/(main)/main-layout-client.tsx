"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserSettings } from "@/lib/evolu/hooks";
import { AppShell } from "@/components/layout";
import { evolu } from "@/lib/evolu/schema";

if (typeof window !== "undefined") {
  (window as unknown as { clearAll: () => void }).clearAll = () => {
    evolu.resetAppOwner();
    console.log("All data cleared. Refresh the page.");
  };
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const settings = useUserSettings();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give Evolu a moment to load from IndexedDB
    // useQuery returns empty array initially, then updates when data loads
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Wait for initial load to complete before making redirect decisions
    if (isLoading) return;

    // If no settings exist (null) or onboarding not completed, redirect to onboarding
    if (settings === null || !settings.onboardingCompleted) {
      router.push("/onboarding");
    }
  }, [settings, router, isLoading]);

  // Show nothing while loading or if onboarding not completed
  if (isLoading || !settings?.onboardingCompleted) {
    return null;
  }

  return <>{children}</>;
}

export function MainLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGuard>
      <AppShell>{children}</AppShell>
    </OnboardingGuard>
  );
}
