#!/usr/bin/env bash
# Check whether auditd and rsyslog are active.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v systemctl >/dev/null 2>&1; then
  cp_skip "Skipped: systemctl is not installed, so auditd and rsyslog were not checked."
fi
audit="$(systemctl is-active auditd 2>/dev/null || true)"
rsyslog="$(systemctl is-active rsyslog 2>/dev/null || true)"
python3 - "$audit" "$rsyslog" <<'PY'
import json, sys
audit, rsyslog = sys.argv[1].strip(), sys.argv[2].strip()
findings = []
if audit != "active":
    findings.append({"id": "auditd", "severity": "medium", "title": "auditd not active", "detail": audit or "unknown"})
if rsyslog != "active":
    findings.append({"id": "rsyslog", "severity": "medium", "title": "rsyslog not active", "detail": rsyslog or "unknown"})

def state(name, value):
    return f"{name} is running" if value == "active" else f"{name} is not running"

summary = f"{state('auditd', audit)}; {state('rsyslog', rsyslog)}"
tone = "clear" if audit == "active" and rsyslog == "active" else "watch"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "extra": {"auditd": audit, "rsyslog": rsyslog},
    "findings": findings,
    "report": {
        "tone": tone,
        "facts": [
            {"label": "auditd", "value": audit or "unknown"},
            {"label": "rsyslog", "value": rsyslog or "unknown"},
        ],
    },
}, indent=2))
PY
