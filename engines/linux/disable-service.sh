#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
svc="${2:-${CP_SERVICE:-}}"
if [[ -z "$svc" || ! "$svc" =~ ^[A-Za-z0-9:_.@+-]+$ ]]; then
  echo '{"ok":false,"error":"service required"}' >&2
  exit 1
fi
systemctl disable --now "$svc"
echo "{\"ok\":true,\"detail\":\"disabled $svc\"}"
