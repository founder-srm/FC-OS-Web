Coupling small + localized. 4 files touch Neon. Two separate migrations, very different difficulty:

## DB layer — easy

Drizzle is Postgres-agnostic. Schemas, queries, `dbActions.ts` logic = **zero change**. Only `db.ts` swaps driver.

```ts
// before: neon-http
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
const sql = neon(url);
export const db = drizzle(sql, { schema });

// after: plain postgres (postgres-js, already in deps!)
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
const client = postgres(url);
export const db = drizzle(client, { schema });
```

`postgres` pkg already in `package.json`. `drizzle-kit push` config unchanged (just new `DATABASE_URL`).

**One snag:** `db.batch()` — neon-http-only API (no interactive txns). 2 real call sites in `dbActions.ts` (lines 35, 306). Real driver HAS transactions, so rewrite to `db.transaction(async tx => …)`. Strictly better. ~20 min.

Supabase = Postgres under hood → identical. Or just local `postgres:16` Docker container. DB migration = swap connection string + 2 batch rewrites. **Trivial.**

## Auth layer — real work

This is the cost, not the DB. `@neondatabase/auth` = Neon-hosted Better Auth. 3 files: `server.ts`, `client.ts`, `proxy.ts` + login OTP flow.

Two paths:

**A) Self-host Better Auth** (recommended — Neon Auth IS Better Auth)
- Swap `createNeonAuth` → `betterAuth()` config, `createAuthClient` from `better-auth/react`.
- Keep emailOTP plugin → same `emailOtp.sendVerificationOtp` / `signIn.emailOtp` client API. Login.tsx barely changes.
- Add: own email sender (Resend/SMTP) for OTP, Better Auth's own tables in your Postgres (drizzle adapter), session secret.
- Middleware → Better Auth's Next handler. `getSession()` / `getAuthState()` shape mostly survives.
- Effort: ~1-2 days. Concepts map 1:1.

**B) Supabase Auth** — full rewrite. Different API, different session model, RLS-oriented. Don't, unless you want Supabase's whole stack. Throws away OTP flow + `getAuthState` plumbing.

## Verdict

| Piece                                  | Effort   | Risk   |
| -------------------------------------- | -------- | ------ |
| DB (Neon→local/Supabase Postgres)      | hours    | low    |
| Auth (Neon Auth→self-host Better Auth) | 1-2 days | medium |
| Auth → Supabase Auth                   | rewrite  | high   |

**Best local-OSS combo:** Docker Postgres (or Supabase self-host) + self-hosted Better Auth + Resend/SMTP for OTP. DB nearly free. Auth is the whole project.

Want me to spike the `db.ts` swap + `db.batch`→`transaction` rewrite? That's the safe, reversible half — provable in isolation before touching auth.