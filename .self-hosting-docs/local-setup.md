# Fully-local setup (no Neon)

Branch `feat/local-self-hosting` runs FC OS against a 100% local stack: Supabase
Postgres + self-hosted Better Auth + inbucket (local SMTP catcher). `main` stays on Neon.

## Prerequisites

- **A container runtime** (Docker Desktop / OrbStack / Podman). Supabase local needs one.
  Not installed yet on this machine — install before `supabase start`.
- Supabase CLI (already present: `supabase --version`).
- Bun.

## Bring-up

```bash
# 1. Local Postgres + Studio + inbucket (email catcher)
supabase start                 # Postgres :54322 · Studio :54323 · inbucket UI :54324 / smtp :54325

# 2. Env
cp .env.example .env
#   - DATABASE_URL is preset to the Supabase local DB
#   - set BETTER_AUTH_SECRET:  openssl rand -base64 32

# 3. Schema + seed (we use push, not migrate — see docs/pushing-migrations.md)
bunx drizzle-kit push --config drizzle.config.ts
bun run seed

# 4. App
bun run dev                    # http://localhost:3000
```

## Login flow (local)

1. `/login` → enter an SRM email → "send code".
2. Better Auth's emailOTP plugin sends the OTP via nodemailer → inbucket.
3. Open the inbox UI at **http://localhost:54324**, read the code, paste it.
4. First sign-in creates the auth user → app routes to `/onboarding`.

## Teardown

```bash
supabase stop                  # add --no-backup to wipe the local DB volume
```

## Notes

- DB driver is `postgres-js` (`src/database/db.ts`); `db.batch()` was replaced by real
  `db.transaction()` calls — no neon-http coupling remains.
- Better Auth tables (`user`/`session`/`account`/`verification`) live in the app's Drizzle
  schema and are created by `drizzle-kit push` alongside the app tables.
- Better Auth user ids are pinned to UUIDs so `profiles.auth_user_id` (uuid) keeps matching.
