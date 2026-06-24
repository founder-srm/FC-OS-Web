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

// OTP email delivery over real SMTP (Resend by default — smtp.resend.com:465).
// Configured via SMTP_* env vars; sender via MAIL_FROM. `auth` is only attached
// when SMTP_USER is set, so an unauthenticated relay still works if ever needed.
const mailer = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE !== "false", // 465 = implicit TLS
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL,
  // Apex + www both served at :3005; Better Auth otherwise trusts only baseURL.
  trustedOrigins: ["https://fc-os.tech", "https://www.fc-os.tech"],
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  // UUID ids so Better Auth's `user.id` matches the uuid `profiles.auth_user_id`.
  advanced: { database: { generateId: "uuid" } },
  plugins: [
    // Passwordless OTP — preserves the client `emailOtp` API the login flow uses.
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await mailer.sendMail({
          from: process.env.MAIL_FROM ?? "FC OS <no-reply@fc-os.tech>",
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
