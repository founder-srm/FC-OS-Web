import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { createTransport } from "nodemailer";
import { db } from "@/database/db";
import * as authSchema from "@/database/schemas/auth";

// Singleton self-hosted Better Auth server instance. Exposes the Better Auth
// server API under `auth.api.*` (e.g. `auth.api.getSession`) plus `auth.handler`
// for the API route. Route gating in proxy.ts uses `getSessionCookie`.
//
// NOTE: any RSC / Server Action / Route Handler that reads the session must set
// `export const dynamic = "force-dynamic"`.
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET must be set in the environment");
}

// Local OTP delivery → Supabase's inbucket SMTP catcher (no real send in dev).
// Inbox UI at http://localhost:54324. See .self-hosting-docs/local-setup.md.
const mailer = createTransport({
  host: process.env.SMTP_HOST ?? "127.0.0.1",
  port: Number(process.env.SMTP_PORT ?? 54325),
  secure: false,
});

export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  // UUID ids so Better Auth's `user.id` matches the uuid `profiles.auth_user_id`.
  advanced: { database: { generateId: "uuid" } },
  plugins: [
    // Passwordless OTP — preserves the client `emailOtp` API the login flow uses.
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await mailer.sendMail({
          from: "FC OS <no-reply@foundersclub.local>",
          to: email,
          subject: "Your FC OS login code",
          text: `Your FC OS login code is ${otp}. It expires shortly.`,
        });
      },
    }),
    // Must be last: lets Server Actions set auth cookies.
    nextCookies(),
  ],
});
