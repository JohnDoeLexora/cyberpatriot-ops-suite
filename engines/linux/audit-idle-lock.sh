#!/usr/bin/env bash
# Read-only: TMOUT and logind IdleAction.
set -euo pipefail
python3 - <<'PY'
import json, os, re
blob = ""
for p in ["/etc/profile", "/etc/bash.bashrc", "/etc/profile.d/tmout.sh", "/etc/systemd/logind.conf"]:
    if os.path.isfile(p):
        blob += open(p, encoding="utf-8", errors="replace").read() + "\n"
tmout = re.search(r"\bTMOUT\s*=\s*(\d+)", blob)
idle = re.search(r"(?m)^\s*IdleAction\s*=\s*(\S+)", blob)
findings = []
if not tmout or int(tmout.group(1)) > 900:
    findings.append({"id": "tmout", "severity": "medium", "title": "TMOUT missing or too long"})
print(json.dumps({"ok": True, "extra": {"TMOUT": tmout.group(1) if tmout else None, "IdleAction": idle.group(1) if idle else None}, "findings": findings}))
PY
