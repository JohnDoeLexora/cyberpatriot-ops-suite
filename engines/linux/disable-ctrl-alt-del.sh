#!/usr/bin/env bash
# Mask ctrl-alt-del.target when systemd is present.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_need_cmd systemctl "This op needs systemd."
state="$(systemctl is-enabled ctrl-alt-del.target 2>/dev/null || true)"
if [[ "$state" == "masked" ]]; then
  cp_note_ok "ctrl-alt-del.target is already masked"
else
  cp_note_change "Will mask ctrl-alt-del.target"
  if ! cp_is_dry; then
    cp_need_root
    systemctl mask ctrl-alt-del.target || cp_fail "Could not mask ctrl-alt-del.target."
  fi
fi
serial="$(systemctl is-enabled 'serial-getty@ttyS0' 2>/dev/null || true)"
if [[ -n "$serial" && "$serial" != "not-found" && "$serial" != "disabled" && "$serial" != "masked" ]]; then
  cp_note_change "Will disable serial-getty@ttyS0"
  if ! cp_is_dry; then
    cp_need_root
    systemctl disable --now 'serial-getty@ttyS0' || cp_warn "Could not disable serial-getty@ttyS0."
  fi
fi
cp_finish
