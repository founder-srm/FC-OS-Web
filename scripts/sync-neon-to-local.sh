#!/usr/bin/env bash
# Full one-way data mirror: Neon prod (source of truth) -> local Supabase Postgres.
# - Replaces ALL local public app-table data with Neon's (handles edits + deletes,
#   not just additions). Preserves the self-hosted Better Auth tables
#   (user/session/account/verification) and refreshes user identities from
#   neon_auth.user (upsert).
# - FK-safe (session_replication_role=replica) + ATOMIC (single transaction:
#   if the reload fails, the truncate rolls back and local is left untouched).
# - Takes a safety backup of local app data first.
# Re-runnable anytime. Reads Neon creds from FC-OS-Web/.env at runtime (no secrets here).
set -euo pipefail

NEON_URL=$(grep -E '^DATABASE_URL=' "$HOME/hosting/FC-OS-Web/.env" | head -1 | cut -d= -f2-)
LOCAL_URL="postgres://postgres:postgres@127.0.0.1:54322/postgres"
TS=$(date +%Y%m%d-%H%M%S)
mkdir -p "$HOME/backups"
BACKUP="$HOME/backups/local-presync-$TS.sql"

AUTH_TABLES="('user','session','account','verification')"
APP_TABLES=$(psql "$LOCAL_URL" -tAc "
  select string_agg(quote_ident(table_name), ',')
  from information_schema.tables
  where table_schema='public' and table_type='BASE TABLE'
    and table_name not in $AUTH_TABLES")

echo "==> [1/5] Safety backup of local app data -> $BACKUP"
pg_dump "$LOCAL_URL" --data-only --schema=public --no-owner --no-privileges --disable-triggers \
  -T '"user"' -T session -T account -T verification -f "$BACKUP"

echo "==> [2/5] Dump Neon app data (column-inserts; immune to column-order diffs)"
TMP=$(mktemp)
pg_dump "$NEON_URL" --data-only --schema=public --column-inserts \
  --no-owner --no-privileges -f "$TMP" 2>/dev/null
CNT=$(grep -c '^INSERT' "$TMP" || true)
if [ "${CNT:-0}" -lt 1 ]; then
  echo "ABORT: Neon dump has 0 inserts — refusing to wipe local. (check Neon connectivity)"; rm -f "$TMP"; exit 1
fi
echo "    $CNT insert statements from Neon"

echo "==> [3/5] Replace local app tables atomically (truncate + reload)"
psql "$LOCAL_URL" --single-transaction -v ON_ERROR_STOP=1 <<SQL
SET session_replication_role = replica;
TRUNCATE $APP_TABLES RESTART IDENTITY CASCADE;
\i $TMP
SQL
rm -f "$TMP"

echo "==> [4/5] Refresh auth identities from neon_auth.user (upsert by id)"
psql "$NEON_URL" -tAc "\copy (select id,name,email,\"emailVerified\",\"createdAt\",\"updatedAt\" from neon_auth.\"user\") to '/tmp/nu.csv' csv"
psql "$LOCAL_URL" -v ON_ERROR_STOP=1 <<SQL
create temp table _u(id uuid,name text,email text,ev bool,ca timestamptz,ua timestamptz);
\copy _u from '/tmp/nu.csv' csv
insert into "user"(id,name,email,email_verified,created_at,updated_at)
select id,name,email,true,ca,coalesce(ua,now()) from _u
on conflict (id) do update
  set name=excluded.name, email=excluded.email, updated_at=excluded.updated_at;
SQL
rm -f /tmp/nu.csv

echo "==> [5/5] Verify (neon vs local)"
for t in profiles opus_tasks opus_task_assignees user_roles role_permissions roles domains app_settings; do
  n=$(psql "$NEON_URL" -tAc "select count(*) from \"$t\";" 2>/dev/null || echo ERR)
  l=$(psql "$LOCAL_URL"  -tAc "select count(*) from \"$t\";" 2>/dev/null || echo ERR)
  printf "    %-20s neon=%-4s local=%-4s %s\n" "$t" "$n" "$l" "$([ "$n" = "$l" ] && echo OK || echo DRIFT)"
done
echo "    orphan_profiles: $(psql "$LOCAL_URL" -tAc "select count(*) from profiles p left join \"user\" u on u.id=p.auth_user_id where p.auth_user_id is not null and u.id is null;")"
echo "DONE. Local now mirrors Neon. Safety backup: $BACKUP"
