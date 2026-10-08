#!/usr/bin/env bash
# Enable ufw. Idempotent when the firewall is already active.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_need_cmd ufw "Install it with: sudo apt-get install ufw"
status="$(ufw status 2>/dev/null || true)"
if printf '%s\n' "$status" | grep -q "Status: active"; then
  cp_note_ok "ufw is already enabled"
  cp_finish
fi
cp_note_change "Will enable ufw (ufw --force enable)"
if ! cp_is_dry; then
  cp_need_root
  ufw --force enable || cp_fail "ufw --force enable failed. Try: sudo apt-get install ufw && sudo ufw --force enable"
fi
cp_finish
