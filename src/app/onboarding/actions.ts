"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/database/db";
import { profiles } from "@/database/schemas/profiles";
import { auth } from "@/lib/auth/server";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { onboardProfile } from "@/utils/dbActions";

export type OnboardingActionState = { error: string } | undefined;

export async function submitOnboarding(
  input: unknown,
): Promise<OnboardingActionState> {
  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user) return { error: "Your session expired. Please sign in again." };

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  // Idempotency: if a profile already exists for this auth user, don't create a
  // second one — just move them along to the pending screen.
  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.authUserId, user.id))
    .limit(1);

  if (!existing) {
    try {
      await onboardProfile(user.id, user.email, parsed.data);
    } catch {
      return { error: "Could not complete onboarding. Please try again." };
    }
  }

  redirect("/pending");
}
