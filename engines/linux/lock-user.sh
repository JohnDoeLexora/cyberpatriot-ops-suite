#!/usr/bin/env bash
# Lock a local password without deleting the account.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
user="${2:-${CP_USERNAME:-}}"
if [[ -z "$user" ]] || ! cp_safe_user "$user"; then
  cp_fail "username is required. Nothing was changed."
fi
if [[ "$user" == "root" ]]; then
  cp_fail "Refusing to lock root here. Use lock-root-account."
fi
cp_refuse_self "$user"
if ! cp_user_exists "$user"; then
  cp_fail "User '${user}' does not exist. Nothing was changed."
fi
status="$(cp_password_status "$user")"
if [[ "$status" == "locked" ]]; then
  cp_note_ok "Password for ${user} is already locked"
  cp_finish
fi
cp_note_change "Will lock password for ${user} (passwd -l)"
if ! cp_is_dry; then
  cp_need_root
  passwd -l "$user" || cp_fail "Could not lock ${user}. Try: sudo passwd -l ${user}"
fi
cp_finish
