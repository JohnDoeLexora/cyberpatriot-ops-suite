#!/usr/bin/env bash
# Install distro fail2ban only, then enable it.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
if command -v systemctl >/dev/null 2>&1; then
  active="$(systemctl is-active fail2ban 2>/dev/null || true)"
  enabled="$(systemctl is-enabled fail2ban 2>/dev/null || true)"
  if [[ "$active" == "active" && ( "$enabled" == "enabled" || "$enabled" == "static" ) ]]; then
    cp_note_ok "fail2ban is already enabled and active"
    cp_finish
  fi
fi
if ! command -v fail2ban-server >/dev/null 2>&1 && ! command -v fail2ban-client >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    cp_note_change "Will install distro package fail2ban (apt-get install fail2ban) and enable it"
  elif command -v dnf >/dev/null 2>&1; then
    cp_note_change "Will install distro package fail2ban (dnf install fail2ban) and enable it"
  else
    cp_skip "Skipped: fail2ban is not installed and neither apt-get nor dnf is available."
  fi
else
  cp_note_change "Will enable fail2ban (systemctl enable --now fail2ban)"
fi
if cp_is_dry; then
  cp_finish
fi
cp_need_root
cp_need_cmd systemctl "fail2ban needs systemd to enable the service."
if ! command -v fail2ban-server >/dev/null 2>&1 && ! command -v fail2ban-client >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y fail2ban || cp_fail "apt-get install fail2ban failed. No unofficial installer was used."
  else
    dnf install -y fail2ban || cp_fail "dnf install fail2ban failed. No unofficial installer was used."
  fi
fi
systemctl enable --now fail2ban || cp_fail "Could not enable fail2ban. Try: sudo systemctl enable --now fail2ban"
cp_finish
