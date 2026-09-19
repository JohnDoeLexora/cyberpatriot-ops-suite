#!/usr/bin/env bash
# Create missing README users without inventing passwords; flag extras (do not auto-disable).
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
allow="${CP_ALLOWLIST:-config/allowed-users.txt}"
admins="${CP_ADMINS:-config/allowed-admins.txt}"
created=()
manual=()
while IFS= read -r name; do
  name="${name%%#*}"
  name="$(echo "$name" | tr -d '[:space:]')"
  [[ -z "$name" ]] && continue
  [[ "$name" =~ ^[A-Za-z0-9._-]+$ ]] || continue
  if ! getent passwd "$name" >/dev/null 2>&1; then
    useradd -m -s /bin/bash "$name"
    created+=("$name")
    manual+=("passwd $name")
  fi
done < "$allow"
if [[ -f "$admins" ]]; then
  while IFS= read -r name; do
    name="${name%%#*}"
    name="$(echo "$name" | tr -d '[:space:]')"
    [[ -z "$name" || "$name" == "root" ]] && continue
    [[ "$name" =~ ^[A-Za-z0-9._-]+$ ]] || continue
    getent passwd "$name" >/dev/null 2>&1 || continue
    usermod -aG sudo "$name" 2>/dev/null || usermod -aG wheel "$name" 2>/dev/null || true
  done < "$admins"
fi
printf '{"ok":true,"created":%s,"setPasswordManually":%s,"note":"extras are not auto-disabled; passwords never invented"}\n' \
  "$(printf '%s\n' "${created[@]:-}" | python3 -c 'import json,sys; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))')" \
  "$(printf '%s\n' "${manual[@]:-}" | python3 -c 'import json,sys; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))')"
