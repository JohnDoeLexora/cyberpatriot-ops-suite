#!/usr/bin/env bash
# Turn ufw logging up and keep default deny incoming.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_need_cmd ufw "Install it with: sudo apt-get install ufw"
verbose="$(ufw status verbose 2>/dev/null || true)"
if printf '%s\n' "$verbose" | grep -q "Logging: on (high)" && printf '%s\n' "$verbose" | grep -q "Default: deny (incoming)"; then
  cp_note_ok "ufw logging is already high and incoming is already deny"
  cp_finish
fi
cp_note_change "Will set ufw logging high, default deny incoming, default allow outgoing"
if ! cp_is_dry; then
  cp_need_root
  ufw logging high || cp_fail "ufw logging high failed."
  ufw default deny incoming || cp_fail "ufw default deny incoming failed."
  ufw default allow outgoing || cp_fail "ufw default allow outgoing failed."
fi
cp_finish
