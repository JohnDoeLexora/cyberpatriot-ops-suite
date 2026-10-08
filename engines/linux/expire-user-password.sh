#!/usr/bin/env bash
# Force a password change at next login. Never prints the password.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
user="${2:-${CP_USERNAME:-}}"
if [[ -z "$user" ]] || ! cp_safe_user "$user"; then
  cp_fail "username is required. Nothing was changed."
fi
cp_need_cmd chage "Install it with: sudo apt-get install passwd"
if ! cp_user_exists "$user"; then
  cp_fail "User '${user}' does not exist. Nothing was changed."
fi
if chage -l "$user" 2>/dev/null | grep -q "password must be changed"; then
  cp_note_ok "Password for ${user} is already expired"
  cp_finish
fi
cp_note_change "Will expire the password for ${user} (chage -d 0). The password is not printed."
if ! cp_is_dry; then
  cp_need_root
  chage -d 0 "$user" || cp_fail "chage failed for ${user}. Try: sudo chage -d 0 ${user}"
fi
cp_finish
