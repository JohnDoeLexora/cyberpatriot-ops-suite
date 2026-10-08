#!/usr/bin/env bash
# Lock the root password. Does not delete root.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
if ! cp_user_exists root; then
  cp_skip "Skipped: the root account is not present."
fi
status="$(cp_password_status root)"
if [[ "$status" == "locked" ]]; then
  cp_note_ok "root password is already locked"
  cp_finish
fi
cp_note_change "Will lock the root password (passwd -l root). The account is not deleted."
if ! cp_is_dry; then
  cp_need_root
  passwd -l root || cp_fail "Could not lock root. Try: sudo passwd -l root"
fi
cp_finish
