import { auth } from "@/lib/auth/server";

// Proxies all browser auth calls (sign-up, OTP, session, …) to Neon Auth.
// The folder name `[...path]` matches the handler's expected `params.path`.
export const { GET, POST } = auth.handler();
