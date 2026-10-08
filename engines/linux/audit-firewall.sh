#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v ufw >/dev/null 2>&1 && ! command -v iptables >/dev/null 2>&1; then
  cp_skip "Skipped: ufw is not installed. Install it with: sudo apt-get install ufw. iptables is also missing, so there is no ruleset to list."
fi
python3 - <<'PY'
import json, shutil, subprocess
def run(cmd):
    try:
        return subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT)
    except Exception as e:
        return str(e)
out = {
    "ufw": run(["ufw", "status", "verbose"]) if shutil.which("ufw") else "ufw missing",
    "iptables": run(["iptables", "-S"]) if shutil.which("iptables") else "iptables missing",
}
print(json.dumps({"ok": True, "extra": out}, indent=2)[:20000])
PY
