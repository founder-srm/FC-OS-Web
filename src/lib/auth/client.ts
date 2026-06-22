"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// Browser-side Neon Auth client. Talks to the `/api/auth/*` route handler on
// the same origin. Used by the signup / verify-email / login forms:
//   authClient.signUp.email({ email, password, name })
//   authClient.emailOtp.sendVerificationOtp({ email, type })
//   authClient.emailOtp.verifyEmail({ email, otp })
//   authClient.signIn.emailOtp({ email, otp })
export const authClient = createAuthClient();
