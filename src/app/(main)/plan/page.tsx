"use client";

import dynamic from "next/dynamic";

/**
 * Plan page with dynamic client-only rendering.
 *
 * Evolu uses ES2024 features (Set.difference) that aren't available during SSR.
 * Using dynamic import with ssr: false ensures Evolu only loads on the client.
 */
const PlanContent = dynamic(
  () => import("./plan-content").then((mod) => mod.PlanContent),
  { ssr: false }
);

export default function PlanPage() {
  return <PlanContent />;
}
