#!/usr/bin/env bash
# Disable rsh, rlogin, and rexec units when installed.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_need_cmd systemctl "This op needs systemd."
found=0
for svc in rsh.socket rlogin.socket rexec.socket rsh.service rlogin.service rexec.service; do
  enabled="$(systemctl is-enabled "$svc" 2>/dev/null || true)"
  if [[ -z "$enabled" || "$enabled" == "not-found" ]]; then
    continue
  fi
  found=1
  cp_refuse_required_service "$svc"
  active="$(systemctl is-active "$svc" 2>/dev/null || true)"
  if [[ "$enabled" == "disabled" || "$enabled" == "masked" ]] && [[ "$active" != "active" ]]; then
    cp_note_ok "Service ${svc} is already disabled"
    continue
  fi
  cp_note_change "Will disable service ${svc}"
  if ! cp_is_dry; then
    cp_need_root
    systemctl disable --now "$svc" || cp_fail "Could not disable ${svc}."
  fi
done
if [[ "$found" -eq 0 ]]; then
  cp_skip "Skipped: rsh/rlogin/rexec are not installed."
fi
cp_finish
