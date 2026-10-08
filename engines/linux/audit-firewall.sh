#!/usr/bin/env bash
# Read-only firewall status. Never enables, disables, or edits rules.
# Re-running is safe. CP_DRY_RUN=1 changes nothing.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v ufw >/dev/null 2>&1 && ! command -v iptables >/dev/null 2>&1 && ! command -v nft >/dev/null 2>&1; then
  cp_skip "Skipped: ufw is not installed. Install it with: sudo apt-get install ufw. iptables is also missing, so there is no ruleset to list."
fi
python3 "$(cd "$(dirname "$0")" && pwd)/_firewall_status.py"
