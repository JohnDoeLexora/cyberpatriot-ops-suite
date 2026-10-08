#!/usr/bin/env bash
# Disable the guest account when it exists.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
target=""
for candidate in guest Guest; do
  if cp_user_exists "$candidate"; then
    target="$candidate"
    break
  fi
done
if [[ -z "$target" ]]; then
  cp_skip "Skipped: no guest account is present on this image."
fi
cp_refuse_self "$target"
shell="$(cp_user_shell "$target")"
status="$(cp_password_status "$target")"
if [[ "$status" == "locked" && ( "$shell" == "/usr/sbin/nologin" || "$shell" == "/sbin/nologin" ) ]]; then
  cp_note_ok "Guest account ${target} is already locked"
  cp_finish
fi
cp_note_change "Will disable guest account ${target} (lock + nologin)"
if ! cp_is_dry; then
  cp_need_root
  usermod -L "$target" 2>/dev/null || passwd -l "$target" || cp_fail "Could not lock ${target}."
  usermod -s /usr/sbin/nologin "$target" || cp_fail "Could not set nologin on ${target}."
fi
cp_finish
