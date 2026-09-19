#!/usr/bin/env bash
# Read-only: SNMP default communities. Does not walk other hosts.
set -euo pipefail
python3 - <<'PY'
import json, os, re
cfg = ""
for p in ["/etc/snmp/snmpd.conf", "/etc/snmpd.conf"]:
    if os.path.isfile(p):
        cfg = open(p, encoding="utf-8", errors="replace").read()
        break
comms = re.findall(r"(?im)^\s*(?:rocommunity|rwcommunity|com2sec)\s+(\S+)", cfg)
findings = [{"id": f"comm:{c}", "severity": "critical" if c.lower()=="private" else "high", "title": f"SNMP community {c}"} for c in comms if c.lower() in {"public", "private", "snmp"}]
print(json.dumps({"ok": True, "extra": {"communities": comms}, "findings": findings}))
PY
