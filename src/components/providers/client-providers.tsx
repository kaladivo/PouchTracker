"use client";

import { EvoluProvider, evolu } from "@/lib/evolu/schema";
import { useDevTools } from "@/lib/dev-tools";

interface ClientProvidersProps {
  children: React.ReactNode;
}

function DevToolsInitializer() {
  useDevTools();
  return null;
}

/**
 * Client-only providers that include Evolu.
 * This is dynamically imported with ssr: false to avoid SSR issues
 * with Evolu's ES2024 dependencies (Set.difference).
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <EvoluProvider value={evolu}>
      {process.env.NODE_ENV === "development" && <DevToolsInitializer />}
      {children}
    </EvoluProvider>
  );
}
