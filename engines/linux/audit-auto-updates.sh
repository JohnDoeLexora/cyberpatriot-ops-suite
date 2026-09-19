#!/usr/bin/env bash
# Read-only: unattended-upgrades / APT Periodic.
set -euo pipefail
python3 - <<'PY'
import json, os, re
text = ""
for p in ["/etc/apt/apt.conf.d/20auto-upgrades", "/etc/apt/apt.conf.d/10periodic"]:
    if os.path.isfile(p):
        text += open(p, encoding="utf-8", errors="replace").read() + "\n"
m = re.search(r'Unattended-Upgrade\s+"?(\d+)"?', text)
findings = []
if not m or m.group(1) == "0":
    findings.append({"id": "uu", "severity": "medium", "title": "unattended-upgrades not enabled", "remediationOpId": "apply-security-updates"})
print(json.dumps({"ok": True, "extra": {"unattendedUpgrade": m.group(1) if m else None}, "findings": findings}))
PY
