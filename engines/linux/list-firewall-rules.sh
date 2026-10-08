#!/usr/bin/env bash
# Show ufw or iptables rules. Skips when neither tool exists.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v ufw >/dev/null 2>&1 && ! command -v iptables >/dev/null 2>&1; then
  cp_skip "Skipped: neither ufw nor iptables is installed. Install ufw with: sudo apt-get install ufw"
fi
ufw_out=""
ipt_out=""
if command -v ufw >/dev/null 2>&1; then
  ufw_out="$(ufw status verbose 2>&1 || true)"
fi
if command -v iptables >/dev/null 2>&1; then
  ipt_out="$(iptables -S 2>&1 || true)"
fi
python3 - "$ufw_out" "$ipt_out" <<'PY'
import json, sys
ufw, ipt = sys.argv[1], sys.argv[2]
print(json.dumps({"ok": True, "status": "ok", "summary": "Firewall rules.", "extra": {"ufw": ufw[:4000], "iptables": ipt.splitlines()[:80]}}, indent=2))
PY
