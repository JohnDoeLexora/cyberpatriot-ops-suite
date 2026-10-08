#!/usr/bin/env bash
# Show firewall rules. Read-only. Never changes the ruleset.
# Re-running is safe. CP_DRY_RUN=1 changes nothing.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v ufw >/dev/null 2>&1 && ! command -v iptables >/dev/null 2>&1 && ! command -v nft >/dev/null 2>&1; then
  cp_skip "Skipped: neither ufw nor iptables is installed. Install ufw with: sudo apt-get install ufw"
fi
python3 "$(cd "$(dirname "$0")" && pwd)/_firewall_status.py"
