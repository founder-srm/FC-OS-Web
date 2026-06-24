import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/server";

// Proxies all browser auth calls (OTP send/verify, session, sign-out, …) to the
// self-hosted Better Auth instance. The handler routes off the request URL, so
// the catch-all folder name (`[...path]`) is irrelevant.
export const { GET, POST } = toNextJsHandler(auth);
