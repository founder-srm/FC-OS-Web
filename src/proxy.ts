import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

// Next 16 renamed `middleware.ts` -> `proxy.ts`. Neon Auth's middleware gates
// authenticated-only routes and refreshes the session, redirecting anonymous
// requests to `/login`. Onboarding/approval state (no profile, pending,
// rejected) is enforced separately by the dashboard layout via `getAuthState()`.
const authMiddleware = auth.middleware({ loginUrl: "/login" });

export default function proxy(request: NextRequest) {
  // Server Action POSTs (identified by the `next-action` header) must not pass
  // through the Neon Auth middleware: a session refresh/redirect rewrites the
  // POST response and the client throws "An unexpected response was received
  // from the server", aborting the action. These run under `/dashboard` (e.g.
  // member approval), so they're inside the matcher below. Auth for them is
  // already enforced in-action via `getAccessContext()` / `isApprover`.
  if (request.headers.get("next-action")) return NextResponse.next();
  return authMiddleware(request);
}

export const config = {
  // Only `/dashboard` is gated here. `/onboarding` and `/pending` are
  // intentionally excluded: they guard themselves at the page level via
  // `getAuthState()`, and keeping them out of the matcher prevents the
  // middleware from intercepting their Server Action POSTs (which it would
  // redirect to `/login`, breaking the action response).
  matcher: ["/dashboard/:path*"],
};
