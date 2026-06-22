import { auth } from "@/lib/auth/server";

// Next 16 renamed `middleware.ts` -> `proxy.ts`. Neon Auth's middleware gates
// authenticated-only routes and refreshes the session, redirecting anonymous
// requests to `/login`. Onboarding/approval state (no profile, pending,
// rejected) is enforced separately by the dashboard layout via `getAuthState()`.
export default auth.middleware({ loginUrl: "/login" });

export const config = {
  // Public routes (`/`, `/login`, `/signup`, `/verify-email`, `/api/auth/*`)
  // are intentionally excluded. `/onboarding` and `/pending` require a session.
  matcher: ["/dashboard/:path*", "/onboarding", "/pending"],
};
