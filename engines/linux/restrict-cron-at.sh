#!/usr/bin/env bash
# Restrict crontab/at to root (and optional allowed-admins).
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
printf 'root\n' > /etc/cron.allow
printf 'root\n' > /etc/at.allow
chmod 600 /etc/cron.allow /etc/at.allow 2>/dev/null || true
rm -f /etc/cron.deny /etc/at.deny
echo '{"ok":true,"detail":"cron.allow/at.allow = root; deny files removed"}'
