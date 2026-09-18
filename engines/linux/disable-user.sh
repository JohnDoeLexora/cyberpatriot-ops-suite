#!/usr/bin/env bash
# Disable a local account: lock + nologin. Home is left for forensics.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
user="${2:-${CP_USERNAME:-}}"
if [[ -z "$user" || ! "$user" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo '{"ok":false,"error":"username required"}' >&2
  exit 1
fi
usermod -L "$user"
usermod -s /usr/sbin/nologin "$user"
echo "{\"ok\":true,\"detail\":\"disabled $user\"}"
