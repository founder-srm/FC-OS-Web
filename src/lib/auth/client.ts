"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// Browser-side Neon Auth client. Talks to the `/api/auth/*` route handler on
// the same origin. Login is passwordless OTP (`src/components/Login.tsx`):
//   authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })
//   authClient.signIn.emailOtp({ email, otp })
// The first OTP sign-in auto-creates the user, so there is no separate signup.
export const authClient = createAuthClient();
