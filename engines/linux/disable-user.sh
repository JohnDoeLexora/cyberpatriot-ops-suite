#!/usr/bin/env bash
# Disable a local account (lock + nologin). Home is kept.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
user="${2:-${CP_USERNAME:-}}"
if [[ -z "$user" ]] || ! cp_safe_user "$user"; then
  cp_fail "username is required (letters, digits, dot, underscore, hyphen). Nothing was changed."
fi
if [[ "$user" == "root" ]]; then
  cp_fail "Refusing to disable root. Use lock-root-account to lock the root password."
fi
cp_refuse_self "$user"
if ! cp_user_exists "$user"; then
  cp_fail "User '${user}' does not exist. Nothing was changed."
fi
shell="$(cp_user_shell "$user")"
status="$(cp_password_status "$user")"
if [[ "$status" == "locked" && ( "$shell" == "/usr/sbin/nologin" || "$shell" == "/sbin/nologin" ) ]]; then
  cp_note_ok "User ${user} is already locked with a nologin shell"
  cp_finish
fi
if [[ "$status" != "locked" ]]; then
  cp_note_change "Will lock password for ${user}"
  if ! cp_is_dry; then
    cp_need_root
    if ! usermod -L "$user" 2>/dev/null; then
      passwd -l "$user" || cp_fail "Could not lock ${user}. Try: sudo passwd -l ${user}"
    fi
  fi
fi
if [[ "$shell" != "/usr/sbin/nologin" && "$shell" != "/sbin/nologin" ]]; then
  cp_note_change "Will set shell of ${user} from ${shell:-unset} to /usr/sbin/nologin"
  if ! cp_is_dry; then
    cp_need_root
    usermod -s /usr/sbin/nologin "$user" || cp_fail "Could not change the shell for ${user}."
  fi
fi
cp_finish
