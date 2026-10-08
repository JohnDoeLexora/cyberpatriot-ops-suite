#!/usr/bin/env bash
# Expire passwords for one user or the allowlist. Never prints passwords.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_need_cmd chage "Install it with: sudo apt-get install passwd"
user="${2:-${CP_USERNAME:-}}"
expire_one() {
  local name="$1"
  if ! cp_user_exists "$name"; then
    cp_detail "User ${name} is not on this image"
    return 0
  fi
  if chage -l "$name" 2>/dev/null | grep -q "password must be changed"; then
    cp_note_ok "Password for ${name} is already expired"
    return 0
  fi
  cp_note_change "Will expire the password for ${name} (chage -d 0)"
  if cp_is_dry; then
    return 0
  fi
  cp_need_root
  chage -d 0 "$name" || cp_fail "chage failed for ${name}."
}
if [[ -n "$user" ]]; then
  if ! cp_safe_user "$user"; then
    cp_fail "username is not a safe account name. Nothing was changed."
  fi
  expire_one "$user"
  cp_finish
fi
repo="$(cp_repo_root)"
allow="${CP_ALLOWLIST:-${repo}/config/allowed-users.txt}"
cp_load_allowlist "$allow" 1
for name in "${CP_ALLOW_NAMES[@]}"; do
  [[ "$name" == "root" ]] && continue
  expire_one "$name"
done
cp_finish
