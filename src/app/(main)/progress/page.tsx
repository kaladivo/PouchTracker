"use client";

import dynamic from "next/dynamic";

/**
 * Progress page with dynamic client-only rendering.
 *
 * Evolu uses ES2024 features (Set.difference) that aren't available during SSR.
 * Using dynamic import with ssr: false ensures Evolu only loads on the client.
 */
const ProgressContent = dynamic(
  () => import("./progress-content").then((mod) => mod.ProgressContent),
  { ssr: false }
);

export default function ProgressPage() {
  return <ProgressContent />;
}
