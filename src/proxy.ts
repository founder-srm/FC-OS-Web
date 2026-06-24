import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Next 16 renamed `middleware.ts` -> `proxy.ts`. Gates authenticated-only routes
// by checking for the Better Auth session cookie (no DB hit here). Anonymous
// requests are redirected to `/login`. Onboarding/approval state (no profile,
// pending, rejected) is enforced separately by the dashboard layout via
// `getAuthState()`.
export default function proxy(request: NextRequest) {
  // Server Action POSTs (identified by the `next-action` header) must pass
  // through untouched: a redirect here would rewrite the POST response and the
  // client throws "An unexpected response was received from the server",
  // aborting the action. These run under `/dashboard` (e.g. member approval),
  // so they're inside the matcher below. Auth for them is already enforced
  // in-action via `getAccessContext()` / `isApprover`.
  if (request.headers.get("next-action")) return NextResponse.next();

  if (!getSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  // Only `/dashboard` is gated here. `/onboarding` and `/pending` are
  // intentionally excluded: they guard themselves at the page level via
  // `getAuthState()`, and keeping them out of the matcher prevents the proxy
  // from intercepting their Server Action POSTs (which it would redirect to
  // `/login`, breaking the action response).
  matcher: ["/dashboard/:path*"],
};
