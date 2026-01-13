import { OnboardingProvider } from "@/components/onboarding";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
      <div className="safe-area-y flex min-h-screen flex-col">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          {children}
        </div>
      </div>
    </OnboardingProvider>
  );
}
