#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
user="${2:-${CP_USERNAME:-}}"
if [[ -z "$user" || ! "$user" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo '{"ok":false,"error":"username required"}' >&2
  exit 1
fi
usermod -L "$user"
echo "{\"ok\":true,\"detail\":\"locked $user\"}"
