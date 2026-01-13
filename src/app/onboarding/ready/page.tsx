"use client";

import dynamic from "next/dynamic";

/**
 * Ready page with dynamic client-only rendering.
 *
 * Evolu uses ES2024 features (Set.difference) that aren't available during SSR.
 * Using dynamic import with ssr: false ensures Evolu only loads on the client.
 */
const ReadyContent = dynamic(
  () => import("./ready-content").then((mod) => mod.ReadyContent),
  { ssr: false }
);

export default function ReadyPage() {
  return <ReadyContent />;
}
