# Deploying the fully-local self-hosted FC OS

Concrete, end-to-end deploy of the `feat/local-self-hosting` branch on the home box
(**CachyOS / Arch, fish shell**): pull → local Postgres + Better Auth → migrate data
from Neon → test on localhost → run under **pm2** behind your existing **Cloudflare
Tunnel**.

This branch already swapped Neon for a local stack:
- **DB**: `postgres-js` driver → local **Supabase Postgres**.
- **Auth**: self-hosted **Better Auth** (OTP email → Supabase's inbucket catcher).

> Supersedes the B1 plan in `docs/self-hosting.md` (that doc kept Neon Auth hosted).

---

## 1. Install prerequisites (Arch / CachyOS)

`bun`, `node`, `git`, `paru`, `cloudflared` are already on the box. Add the rest:

```fish
# Postgres client (pg_dump / psql — needed for the Neon → local data copy)
sudo pacman -S --needed postgresql

# Container runtime — Supabase local runs in Docker
sudo pacman -S --needed docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER        # then log out / back in for the group

# Supabase CLI (AUR) + pm2
paru -S --needed supabase-bin
bun install -g pm2
```

Verify: `docker info`, `supabase --version`, `pm2 -v`, `pg_dump --version` (want v17).

---

## 2. Pull the branch

```fish
mkdir -p ~/apps; cd ~/apps
git clone git@github.com:founder-srm/FC-OS-Web.git fc-os-web; cd fc-os-web
# already cloned? -> git fetch; and git checkout feat/local-self-hosting; and git pull
git checkout feat/local-self-hosting
bun install
```

---

## 3. Bring up local Postgres + email catcher

```fish
supabase start
```

First run pulls images (slow once). When done it prints local credentials. Defaults:

| Service | Address |
|---|---|
| Postgres | `postgres://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio (DB UI) | http://localhost:54323 |
| Inbucket (OTP inbox) | http://localhost:54324 (SMTP `:54325`) |

---

## 4. Environment file

```fish
cp .env.example .env
echo "BETTER_AUTH_SECRET="(openssl rand -base64 32) >> .env
```

`.env` should now read (DATABASE_URL + SMTP already preset by `.env.example`):

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres
BETTER_AUTH_SECRET=<generated above>
BETTER_AUTH_URL=https://your-domain.com     # public URL served by the tunnel
SMTP_HOST=127.0.0.1
SMTP_PORT=54325
```

> Set `BETTER_AUTH_URL` to the **public** domain your Cloudflare Tunnel serves — OTP
> links/cookies and redirects derive from it. For pure localhost testing,
> `http://localhost:3000` is fine; switch it before exposing the tunnel.

---

## 5. Create the schema + seed

We sync with **push**, not migrate (see `docs/pushing-migrations.md`). This creates the
app tables **and** the Better Auth tables (`user/session/account/verification`).

```fish
bunx drizzle-kit push --config drizzle.config.ts   # interactive — needs a TTY
bun run seed                                        # domains / roles / opus defaults
psql "postgres://postgres:postgres@127.0.0.1:54322/postgres" -c '\dt'
```

---

## 6. Migrate data from Neon → local

Two distinct datasets: **app rows** (public schema) and **auth identities** (Neon Auth's
`neon_auth` schema). Both must come over so existing members keep their profiles and can
log in by the same email.

Set two URLs (fish):

```fish
set -x NEON_URL   "postgres://<user>:<pass>@<ep>.neon.tech/<db>?sslmode=require"
set -x LOCAL_URL  "postgres://postgres:postgres@127.0.0.1:54322/postgres"
```

### 6a. App data (public tables, data only)

The schema already exists locally (Step 5), so copy **data only**. Disable FK/triggers
during load so insert order across foreign keys can't fail.

```fish
pg_dump "$NEON_URL" --data-only --schema=public --no-owner --no-privileges \
  --disable-triggers -f neon-app-data.sql

psql "$LOCAL_URL" --single-transaction \
  -c 'SET session_replication_role = replica;' \
  -f neon-app-data.sql
```

> `--disable-triggers` + `session_replication_role = replica` skip FK checks during the
> bulk load; constraints are re-enforced for all future writes.

### 6b. Auth users (so logins + profile links survive)

Neon Auth mirrors accounts into `neon_auth.users_sync`. Copy them into Better Auth's
`user` table, **preserving the id** — that id is what `profiles.auth_user_id` points at,
and matching emails let Better Auth's OTP sign-in reuse the same account.

```fish
# 1. Confirm the source table + columns (names can vary by Neon Auth version)
psql "$NEON_URL" -c '\d neon_auth.users_sync'

# 2. Export non-deleted users
psql "$NEON_URL" -c "\copy (select id, coalesce(name, email) as name, email, created_at, updated_at from neon_auth.users_sync where deleted_at is null) to 'neon-users.csv' with csv header"

# 3. Load into Better Auth's user table (email_verified=true: they're pre-verified)
psql "$LOCAL_URL" <<'SQL'
create temp table _u (id uuid, name text, email text, created_at timestamptz, updated_at timestamptz);
\copy _u from 'neon-users.csv' with csv header
insert into "user" (id, name, email, email_verified, created_at, updated_at)
select id, name, email, true, created_at, coalesce(updated_at, now()) from _u
on conflict (id) do nothing;
SQL
```

### 6c. Sanity check the link

```fish
# Every profile's auth_user_id should resolve to a user row (expect 0 orphans)
psql "$LOCAL_URL" -c "select count(*) as orphan_profiles from profiles p left join \"user\" u on u.id = p.auth_user_id where p.auth_user_id is not null and u.id is null;"
```

Then clean up the dump files: `rm neon-app-data.sql neon-users.csv`.

---

## 7. Test on localhost

```fish
bun run dev      # http://localhost:3000
```

Checklist:
- [ ] `/login` → enter a migrated member's email → OTP appears in **inbucket**
      (http://localhost:54324) → paste → lands on `/dashboard` (existing profile, no
      re-onboarding).
- [ ] A brand-new email → routes to `/onboarding` → submit → reaches `/pending`.
- [ ] Opus: open a domain board, create/edit/move a task, reorder statuses — all persist
      after refresh (exercises the new `db.transaction` writes).
- [ ] Member Requests / Directory load existing migrated rows.

---

## 8. Build + run under pm2

```fish
bun run build

# Start Next via bun under pm2 (cwd = project, so it loads .env automatically)
pm2 start bun --name fc-os --cwd ~/apps/fc-os-web -- run start
pm2 logs fc-os --lines 50          # confirm it booted on :3000
curl -I http://127.0.0.1:3000      # expect 200 / 307

# Persist across reboots
pm2 save
pm2 startup                        # run the sudo command it prints, then `pm2 save` again
```

> **Postgres must be up before the app.** Supabase's containers restart with Docker
> (`restart` policy), but `supabase start` may need re-running after a full reboot. Verify
> with `supabase status`; if down, `supabase start` then `pm2 restart fc-os`.

---

## 9. Expose via the existing Cloudflare Tunnel

Your tunnel is already configured for the domain. Point its ingress at the app and make
sure `BETTER_AUTH_URL` (Step 4) equals that hostname.

`~/.cloudflared/config.yml`:

```yaml
ingress:
  - hostname: your-domain.com
    service: http://127.0.0.1:3000
  - service: http_status:404
```

```fish
sudo systemctl restart cloudflared
curl -I https://your-domain.com    # expect 200 / 307 from the public domain
```

Then re-test the OTP login against the public domain (cookies/redirects use
`BETTER_AUTH_URL`).

---

## 10. Redeploy & backup

```fish
# Redeploy after pulling changes
cd ~/apps/fc-os-web; and git pull; and bun install; and bun run build; and pm2 restart fc-os

# If the schema changed
bunx drizzle-kit push --config drizzle.config.ts

# Nightly DB backup (add to a systemd timer / cron)
pg_dump "postgres://postgres:postgres@127.0.0.1:54322/postgres" > ~/backups/fcos-(date +%F).sql
```

**Health checklist**
- [ ] `pm2 status` shows `fc-os` online; `supabase status` all healthy.
- [ ] Postgres bound to `127.0.0.1:54322` only — never expose it publicly.
- [ ] `cloudflared` active; public domain returns 200/307.
- [ ] OTP login works end-to-end on the public domain.
