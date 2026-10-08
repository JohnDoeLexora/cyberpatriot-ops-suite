#!/usr/bin/env bash
# Read-only: TMOUT and logind IdleAction.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, re
blob = ""
for path in ["/etc/profile", "/etc/bash.bashrc", "/etc/profile.d/tmout.sh", "/etc/systemd/logind.conf"]:
    if os.path.isfile(path):
        blob += open(path, encoding="utf-8", errors="replace").read() + "\n"
tmout = re.search(r"\bTMOUT\s*=\s*(\d+)", blob)
idle = re.search(r"(?m)^\s*IdleAction\s*=\s*(\S+)", blob)
seconds = int(tmout.group(1)) if tmout else None
findings = []
if seconds is None or seconds > 900:
    findings.append({"id": "tmout", "severity": "medium", "title": "TMOUT missing or too long"})
if seconds is None:
    summary = "Shell idle lock is not set"
    tone = "watch"
elif seconds > 900:
    summary = f"Shell idle lock is {seconds} seconds"
    tone = "watch"
else:
    summary = f"Shell idle lock is {seconds} seconds"
    tone = "clear"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "extra": {"TMOUT": str(seconds) if seconds is not None else None, "IdleAction": idle.group(1) if idle else None},
    "findings": findings,
    "report": {
        "tone": tone,
        "facts": [
            {"label": "TMOUT", "value": "unset" if seconds is None else f"{seconds} seconds"},
            {"label": "IdleAction", "value": idle.group(1) if idle else "unset"},
        ],
    },
}))
PY
