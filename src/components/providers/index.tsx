"use client";

import dynamic from "next/dynamic";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-only providers that include Evolu.
 *
 * Evolu uses ES2024 features (Set.difference) that aren't available during SSR.
 * Using dynamic import with ssr: false ensures Evolu only loads on the client.
 */
const ClientProviders = dynamic(
  () => import("./client-providers").then((mod) => mod.ClientProviders),
  { ssr: false }
);

/**
 * Wrapper that provides theme context at SSR time and Evolu context on client.
 * This ensures theme is available immediately (preventing flash) while
 * Evolu loads only on the client.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ClientProviders>{children}</ClientProviders>
      <Toaster position="top-center" richColors />
    </NextThemesProvider>
  );
}
