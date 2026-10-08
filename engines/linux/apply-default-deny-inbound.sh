#!/usr/bin/env bash
# Set ufw default deny incoming and allow outgoing.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_need_cmd ufw "Install it with: sudo apt-get install ufw"
verbose="$(ufw status verbose 2>/dev/null || true)"
if printf '%s\n' "$verbose" | grep -q "Default: deny (incoming)" && printf '%s\n' "$verbose" | grep -q "allow (outgoing)"; then
  cp_note_ok "ufw already denies incoming and allows outgoing"
else
  cp_note_change "Will set ufw default deny incoming and allow outgoing"
  if ! cp_is_dry; then
    cp_need_root
    ufw default deny incoming || cp_fail "ufw default deny incoming failed."
    ufw default allow outgoing || cp_fail "ufw default allow outgoing failed."
  fi
fi
cp_finish
