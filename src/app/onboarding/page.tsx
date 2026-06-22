import { redirect } from "next/navigation";

import { getAuthState } from "@/lib/auth/context";
import OnboardingForm from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const state = await getAuthState();

  if (state.kind === "unauthenticated") redirect("/login");
  // Already onboarded — they belong on the pending/dashboard side.
  if (state.kind === "active") redirect("/pending");

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <OnboardingForm />
    </main>
  );
}
