#!/usr/bin/env bash
# Read-only: SNMP default communities. Does not walk other hosts.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, re
cfg = ""
for p in ["/etc/snmp/snmpd.conf", "/etc/snmpd.conf"]:
    if os.path.isfile(p):
        cfg = open(p, encoding="utf-8", errors="replace").read()
        break
comms = re.findall(r"(?im)^\s*(?:rocommunity|rwcommunity|com2sec)\s+(\S+)", cfg)
findings = [{"id": f"comm:{c}", "severity": "critical" if c.lower()=="private" else "high", "title": f"SNMP community {c}"} for c in comms if c.lower() in {"public", "private", "snmp"}]
if not cfg:
    summary = "No SNMP config found"
    tone = "empty"
elif findings:
    summary = "SNMP uses a default community"
    tone = "urgent"
else:
    summary = "SNMP config has no public or private community"
    tone = "clear"
print(json.dumps({
    "ok": True,
    "summary": summary,
    "extra": {"communities": comms},
    "findings": findings,
    "report": {"tone": tone, "facts": [
        {"label": "Communities", "value": str(len(comms))},
        {"label": "Default names", "value": str(len(findings))},
    ]},
}))
PY
