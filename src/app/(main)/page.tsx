"use client";

import dynamic from "next/dynamic";

/**
 * Home page with dynamic client-only rendering.
 *
 * Evolu uses ES2024 features (Set.difference) that aren't available during SSR.
 * Using dynamic import with ssr: false ensures Evolu only loads on the client.
 */
const HomeContent = dynamic(
  () => import("./home-content").then((mod) => mod.HomeContent),
  { ssr: false }
);

export default function HomePage() {
  return <HomeContent />;
}
