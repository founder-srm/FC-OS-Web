#!/usr/bin/env bash
# Local dev (Mac): ensure Supabase is up, then run Next dev on :3000.
#   DB    : local Supabase Postgres (127.0.0.1:54322, postgres/postgres)
#   Mail  : Mailpit OTP inbox  -> http://localhost:54324  (no real sends)
#   App   : http://localhost:3000
# Requires OrbStack (or Docker) running. Stop the stack with `supabase stop`.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1; then
  echo "Docker/OrbStack not running — start OrbStack first." >&2; exit 1
fi

supabase status >/dev/null 2>&1 || supabase start

echo "── DB     : 127.0.0.1:54322"
echo "── Mail   : http://localhost:54324  (OTP inbox)"
echo "── App    : http://localhost:3000"
echo
bun run dev
