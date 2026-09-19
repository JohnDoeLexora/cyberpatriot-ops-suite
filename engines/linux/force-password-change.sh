#!/usr/bin/env bash
# Expire password(s) so change is required at next logon. Never prints passwords.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
user="${2:-${CP_USERNAME:-}}"
if [[ -n "$user" ]]; then
  if [[ ! "$user" =~ ^[A-Za-z0-9._-]+$ ]]; then
    echo '{"ok":false,"error":"unsafe username"}' >&2
    exit 1
  fi
  chage -d 0 "$user"
  echo "{\"ok\":true,\"detail\":\"expired $user\"}"
  exit 0
fi
allow="${CP_ALLOWLIST:-config/allowed-users.txt}"
expired=()
if [[ -f "$allow" ]]; then
  while IFS= read -r name; do
    name="${name%%#*}"
    name="$(echo "$name" | tr -d '[:space:]')"
    [[ -z "$name" || "$name" == "root" ]] && continue
    [[ "$name" =~ ^[A-Za-z0-9._-]+$ ]] || continue
    if getent passwd "$name" >/dev/null 2>&1; then
      chage -d 0 "$name" && expired+=("$name")
    fi
  done < "$allow"
fi
echo "{\"ok\":true,\"detail\":\"expired ${#expired[@]} allowlisted humans (not root)\"}"
