# Self-Hosting FC OS on the AIO (`claw`, CachyOS / Arch)

Step-by-step to run this repo + Postgres on the home AIO box and serve it on a domain
over HTTPS. **Brainstorm / far-future doc** — written against a live recon of the box
(`ssh aio`) on 2026-06-23.

---

## Recon snapshot (what the box actually is)

| | |
|---|---|
| Hostname | `claw` |
| CPU | Intel i5-10500 — 6 cores / 12 threads, VT-x on |
| RAM | 14 GiB (11 free), 14 GiB swap |
| Disk | 950 GB NVMe, **920 GB free** |
| OS / kernel | CachyOS (Arch), `7.0.10-cachyos`, systemd 260 |
| Virt | `/dev/kvm` present — Docker/VMs fine |
| Network | **WiFi only** (`wlan0`), LAN `192.168.29.35`, GW `192.168.29.1` |
| Public IP | `49.36.27.121` (Indian ISP) — **behind NAT, assume CGNAT** |

**Already installed:** `bun 1.3.14`, `node 26`, `git`, `paru`/`yay`, `ufw`,
`systemd`, **`tailscale 1.98.2` (active — `claw` + your M4 mac on the tailnet)**.

**Missing (must install):** `docker`/`postgres`, `caddy`, `cloudflared` — though the
recon changes *which* of these you actually need (see Steps 3 & 9).

**User `opdhaker`** is in `wheel` (sudo ✓), not in `docker` (docker not installed).

### What the recon changes vs a naive plan

1. **Port-forwarding is dead.** Public IP ≠ LAN IP and the ISP is residential Indian
   broadband → near-certain CGNAT. No inbound `:443`. Do **not** plan around router
   port-forward. Use a tunnel.
2. **Tailscale is already running** → you get public HTTPS for free via **Funnel**,
   no `cloudflared` install. This becomes the recommended path (Step 9).
3. **No Docker installed** → simplest DB path is **native Postgres via pacman**, not a
   container. Docker stays an option (Step 3 alt).
4. **WiFi-only server.** Works, but for a 24/7 box prefer wiring it to ethernet — WiFi
   drops = site down. Cheap fix, do it before "production".

---

## 0. The two app-level blockers (unchanged by recon)

This repo was built for Neon cloud. Two pieces assume "cloud":

### Blocker A — DB driver (must fix, easy)

`src/database/db.ts` uses `@neondatabase/serverless` + `drizzle-orm/neon-http`. That
driver speaks Neon's HTTP protocol — it will **not** connect to a plain local Postgres.
Fix: switch to `postgres` driver (already a dependency) + `drizzle-orm/postgres-js`.
See **Step 4**. One file.

### Blocker B — Auth (`@neondatabase/auth`, hosted)

`@neondatabase/auth` (Neon Auth) is a **hosted** service; `NEON_AUTH_BASE_URL` points at
Neon's servers. It's Better Auth under the hood, but the auth server runs on Neon — can't
point it at localhost.

| Option | Effort | Result |
|--------|--------|--------|
| **B1. Keep Neon Auth hosted** (recommended) | none | App + DB local; only OTP login calls out to Neon. Works today. |
| **B2. Self-host Better Auth** | large refactor | Fully offline. Rewrite `src/lib/auth/*`, `/api/auth` route, `proxy.ts`, add `better-auth` + an email/OTP sender. Separate task. |

This doc assumes **B1**.

---

## 1. Install the few missing tools

`bun`, `node`, `git`, `paru`, `ufw`, `tailscale` are already on the box. Add only:

```bash
ssh aio
# native Postgres (recommended path — see Step 3) + reverse proxy
sudo pacman -S --needed postgresql caddy
```

Skip `docker`/`cloudflared` unless you choose those alternatives. That's the whole
install delta thanks to recon.

---

## 2. Get the code onto the AIO

```bash
ssh aio
mkdir -p ~/apps && cd ~/apps
git clone <your-repo-url> fc-os-web && cd fc-os-web
bun install            # bun 1.3.14 already present
```

---

## 3. Postgres — native (recommended) 

No Docker on the box, `postgresql` from pacman is lighter for a single app.

```bash
# one-time cluster init
sudo -iu postgres initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql

# create app role + db
sudo -iu postgres psql <<'SQL'
CREATE ROLE fcos WITH LOGIN PASSWORD 'change_me_strong';
CREATE DATABASE fcos OWNER fcos;
SQL
```

Postgres listens on `127.0.0.1:5432` by default — keep it that way, never expose
publicly.

<details>
<summary>Alt: Postgres in Docker (only if you'd rather containerize)</summary>

```bash
sudo pacman -S --needed docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"   # re-login for group
```

`docker-compose.db.yml`:

```yaml
services:
  db:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_USER: fcos
      POSTGRES_PASSWORD: change_me_strong
      POSTGRES_DB: fcos
    ports: ["127.0.0.1:5432:5432"]
    volumes: [fcos_pgdata:/var/lib/postgresql/data]
volumes: { fcos_pgdata: {} }
```
`docker compose -f docker-compose.db.yml up -d`
</details>

---

## 4. Switch the DB driver to local Postgres (Blocker A)

Edit `src/database/db.ts`:

```ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schemas";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in the environment");
}

const client = postgres(databaseUrl);   // local PG, no SSL
export const db = drizzle(client, { schema });
```

Edit `drizzle.config.ts` — drop `ssl: true` (local PG has no TLS):

```ts
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
```

> App already avoids interactive transactions (neon-http limitation), so existing
> `db.batch()` usage stays valid on `postgres-js`. No other code change needed.

---

## 5. Environment file

`~/apps/fc-os-web/.env`:

```bash
DATABASE_URL=postgres://fcos:change_me_strong@127.0.0.1:5432/fcos

# Neon Auth — keep hosted (Blocker B1). From Neon Console → Project → Auth.
NEON_AUTH_BASE_URL=https://<your-neon-auth-url>
NEON_AUTH_COOKIE_SECRET=<paste output of: openssl rand -base64 32>

NEXT_PUBLIC_APP_URL=https://claw.<your-tailnet>.ts.net   # or your custom domain
```

---

## 6. Migrate + seed

```bash
cd ~/apps/fc-os-web
bunx drizzle-kit migrate --config drizzle.config.ts
bun run seed          # optional — initial roles/permissions
psql "$DATABASE_URL" -c '\dt'   # confirm tables
```

---

## 7. Run the app as a systemd service

```bash
bun run build
```

`/etc/systemd/system/fc-os.service`:

```ini
[Unit]
Description=FC OS (Next.js)
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=opdhaker
WorkingDirectory=/home/opdhaker/apps/fc-os-web
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/home/opdhaker/.bun/bin/bun run start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fc-os
curl -I http://127.0.0.1:3000     # expect 200/307
```

---

## 8. Reverse proxy (optional with Tailscale)

If you front with Caddy (local TLS / multiple apps), `/etc/caddy/Caddyfile`:

```
claw.<your-tailnet>.ts.net {
    reverse_proxy 127.0.0.1:3000
}
```

But with Tailscale Serve/Funnel (Step 9) you can point the tunnel straight at
`127.0.0.1:3000` and **skip Caddy entirely**. Pick one TLS terminator.

---

## 9. Domain / public access — use what's already running

Recon killed port-forwarding (CGNAT). Three real options, easiest first:

### 9a. Tailscale Funnel — public HTTPS, zero new installs (recommended)

Tailscale is already active on `claw`. Funnel exposes a local port to the public
internet with automatic `*.ts.net` TLS — no open ports, beats CGNAT.

```bash
ssh aio
tailscale funnel --bg 3000      # serves http://127.0.0.1:3000 publicly w/ TLS
tailscale funnel status
```

You get a stable URL: `https://claw.<your-tailnet>.ts.net`. Set that as
`NEXT_PUBLIC_APP_URL`. (Funnel must be enabled for the tailnet in the admin console:
Access Controls → `nodeAttrs` / Funnel.)

**Custom domain on top:** add a `CNAME your-domain.com → claw.<tailnet>.ts.net`. Note
Funnel only serves the `*.ts.net` cert, so a vanity domain via Funnel needs a fronting
proxy (e.g. Cloudflare in front) — if a vanity domain is a hard requirement, jump to 9b.

### 9b. Tailscale Serve — private, tailnet-only (most secure)

If "domain" can be internal (only your devices need it), skip Funnel:

```bash
tailscale serve --bg 3000
```

Reachable at `https://claw.<tailnet>.ts.net` **only from your tailnet** (your M4 mac is
already on it). Zero public exposure — best for an internal club tool.

### 9c. Cloudflare Tunnel — full custom public domain

Only if you need a real vanity domain publicly. Adds an install:

```bash
paru -S cloudflared
cloudflared tunnel login
cloudflared tunnel create fc-os
cloudflared tunnel route dns fc-os your-domain.com
```

`~/.cloudflared/config.yml`:

```yaml
tunnel: fc-os
credentials-file: /home/opdhaker/.cloudflared/<TUNNEL_ID>.json
ingress:
  - hostname: your-domain.com
    service: http://127.0.0.1:3000
  - service: http_status:404
```

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

### 9d. Port-forward — ❌ not viable

CGNAT + WiFi residential ISP. Don't.

---

## 10. Post-deploy checklist

- [ ] `systemctl status fc-os postgresql` active; `tailscale funnel status` shows `:3000`.
- [ ] OTP login works → confirms Neon Auth reachable (Blocker B1).
- [ ] Postgres bound to `127.0.0.1` only (`ss -tlnp | grep 5432`).
- [ ] Nightly backup: `pg_dump "$DATABASE_URL" > ~/backups/fcos-$(date +%F).sql` on a cron/timer.
- [ ] `sudo ufw default deny incoming` (tunnel needs no inbound ports; keep `22` if you SSH over LAN).
- [ ] **Wire the box to ethernet** before relying on it — WiFi-only = fragile uptime.
- [ ] Redeploy: `git pull && bun install && bun run build && sudo systemctl restart fc-os`.

---

## Summary — decided against recon

| Layer | Choice | Why |
|-------|--------|-----|
| Package manager | **Bun** (present) | repo rule |
| Database | **native Postgres** (pacman) | no Docker on box; lighter |
| DB driver | **drizzle-orm/postgres-js** | neon-http can't reach local PG |
| Auth | **Neon Auth hosted** | self-host = big refactor (B2) |
| Process mgmt | **systemd** | present |
| Public access | **Tailscale Funnel** | already running; CGNAT kills port-forward |
| Reverse proxy | optional Caddy | Funnel can terminate TLS itself |
| Vanity domain | Cloudflare Tunnel (9c) | only if `*.ts.net` not acceptable |
