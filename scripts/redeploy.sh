#!/usr/bin/env bash
# Redeploy the self-hosted FC OS (pm2 app `fc-os-local`, :3005, served at
# fc-os.tech) on the aio box: pull latest -> install -> build -> restart -> check.
#
# Uses a CLEAN pm2 restart (delete + start) rather than a soft `pm2 restart`,
# which avoids the dotenv stale-env gotcha (a soft restart can keep a cached
# process env so an edited .env value is ignored). Safe to re-run anytime.
#
#   bash ~/hosting/fc-os-web-local/scripts/redeploy.sh
set -euo pipefail

APP=fc-os-local
PORT=3005
DIR="$HOME/hosting/fc-os-web-local"
BRANCH=feat/local-self-hosting

cd "$DIR"

echo "==> [1/5] Pull latest ($BRANCH)"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> [2/5] Install deps"
bun install

echo "==> [3/5] Build"
bun run build

echo "==> [4/5] Restart pm2 ($APP on :$PORT)"
pm2 delete "$APP" >/dev/null 2>&1 || true
pm2 start bun --name "$APP" --cwd "$DIR" -- run start --port "$PORT" >/dev/null
pm2 save >/dev/null

echo "==> [5/5] Health check"
ok=0
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT" 2>/dev/null || echo 000)
  if [ "$code" = "200" ]; then echo "    OK http=200 after ${i}s"; ok=1; break; fi
  sleep 1
done
[ "$ok" = 1 ] || { echo "    WARNING: app not answering 200 on :$PORT — check 'pm2 logs $APP'"; exit 1; }

echo "Done. Live at https://fc-os.tech"
