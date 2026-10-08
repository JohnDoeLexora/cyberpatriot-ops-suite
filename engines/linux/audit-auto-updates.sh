#!/usr/bin/env bash
# Read-only: unattended-upgrades / APT Periodic.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, re
text = ""
for path in ["/etc/apt/apt.conf.d/20auto-upgrades", "/etc/apt/apt.conf.d/10periodic"]:
    if os.path.isfile(path):
        text += open(path, encoding="utf-8", errors="replace").read() + "\n"
match = re.search(r'Unattended-Upgrade\s+"?(\d+)"?', text)
value = match.group(1) if match else None
findings = []
if value != "1":
    findings.append({"id": "uu", "severity": "medium", "title": "unattended-upgrades not enabled", "remediationOpId": "apply-security-updates"})
if value == "1":
    summary = "Unattended upgrades are on"
    tone = "clear"
elif value == "0":
    summary = "Unattended upgrades are off"
    tone = "watch"
else:
    summary = "Unattended upgrades are not configured"
    tone = "watch"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "extra": {"unattendedUpgrade": value},
    "findings": findings,
    "report": {
        "tone": tone,
        "facts": [
            {"label": "Unattended-Upgrade", "value": value if value is not None else "unset"},
        ],
    },
}))
PY
