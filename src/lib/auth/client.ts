"use client";

import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Browser-side Better Auth client. Talks to the `/api/auth/*` route handler on
// the same origin. Login is passwordless OTP (`src/components/Login.tsx`):
//   authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })
//   authClient.signIn.emailOtp({ email, otp })
// The first OTP sign-in auto-creates the user, so there is no separate signup.
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});
