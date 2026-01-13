"use client";

import dynamic from "next/dynamic";

/**
 * Main app layout with dynamic client-only rendering.
 *
 * Evolu uses ES2024 features (Set.difference) that aren't available during SSR.
 * Using dynamic import with ssr: false ensures Evolu only loads on the client.
 */
const MainLayoutClient = dynamic(
  () => import("./main-layout-client").then((mod) => mod.MainLayoutClient),
  { ssr: false }
);

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayoutClient>{children}</MainLayoutClient>;
}
