#!/usr/bin/env bash
set -euo pipefail
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
