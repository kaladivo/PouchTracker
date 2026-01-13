"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SettingsLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader className="pb-2">
          <div className="bg-muted h-5 w-20 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-muted h-12 animate-pulse rounded" />
            <div className="bg-muted h-12 animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Settings page with dynamic client-only rendering.
 *
 * Evolu uses ES2024 features (Set.difference) that aren't available during SSR.
 * Using dynamic import with ssr: false ensures Evolu only loads on the client.
 */
const SettingsContent = dynamic(() => import("./settings-content"), {
  ssr: false,
  loading: () => <SettingsLoading />,
});

export default function SettingsPage() {
  return <SettingsContent />;
}
