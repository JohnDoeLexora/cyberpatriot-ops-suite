#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json, os, re, subprocess
def read(p):
    try: return open(p, encoding="utf-8", errors="replace").read()
    except OSError: return ""
tz = read("/etc/timezone").strip() or "unknown"
blob = read("/etc/systemd/timesyncd.conf")+read("/etc/chrony/chrony.conf")+read("/etc/ntp.conf")
servers = re.findall(r"^\s*(?:NTP|server|pool)\s*=?\s*(\S+)", blob, re.M)
findings = []
for s in servers:
    if re.match(r"^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)", s):
        findings.append({"id":f"ntp:{s}","severity":"high","title":f"Unexpected NTP server {s}"})
print(json.dumps({"ok": True, "findings": findings, "extra": {"timezone": tz, "ntpServers": servers}}))
PY
