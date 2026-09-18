#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json, subprocess
keys = [
  "net.ipv4.ip_forward",
  "net.ipv4.tcp_syncookies",
  "net.ipv4.conf.all.accept_redirects",
  "net.ipv4.conf.all.rp_filter",
  "kernel.randomize_va_space",
  "kernel.dmesg_restrict",
]
extra = {}
for k in keys:
    try:
        extra[k] = subprocess.check_output(["sysctl", "-n", k], text=True).strip()
    except Exception as e:
        extra[k] = str(e)
print(json.dumps({"ok": True, "extra": {"sysctl": extra}}, indent=2))
PY
