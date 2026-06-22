import { createNeonAuth } from "@neondatabase/auth/next/server";

// Singleton Neon Auth (Better Auth–based) server instance. Exposes the Better
// Auth server methods (`signIn`, `signUp`, `getSession`, …) plus `.handler()`
// for the API route and `.middleware()` for `proxy.ts`.
//
// NOTE: any RSC / Server Action / Route Handler that calls `auth.getSession()`
// must set `export const dynamic = "force-dynamic"`.
const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl || !cookieSecret) {
  throw new Error(
    "NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET must be set in the environment",
  );
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: { secret: cookieSecret },
});
