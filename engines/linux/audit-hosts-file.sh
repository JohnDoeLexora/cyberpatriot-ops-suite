#!/usr/bin/env bash
# Read /etc/hosts and flag vendor sinkholes. Does not change the file.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, re
root = os.environ.get("CP_ROOT", "")
path = (root + "/etc/hosts") if root else "/etc/hosts"
try:
    text = open(path, encoding="utf-8", errors="replace").read()
except OSError as exc:
    print(json.dumps({"ok": False, "status": "skipped", "summary": f"Skipped: cannot read {path}. {exc}", "exitCode": 3}))
    raise SystemExit(3)
pat = re.compile(r"windowsupdate|microsoft\.com|virustotal|avast|avg|google\.com|facebook", re.I)
findings = []
if pat.search(text):
    findings.append({"id": "hosts", "severity": "medium", "title": "Suspicious hosts redirects", "detail": "The hosts file mentions vendor or update names."})
lines = [line for line in text.splitlines() if line.strip() and not line.strip().startswith("#")]
checklist = []
for index, line in enumerate(lines[:12]):
    checklist.append({
        "id": f"line-{index}",
        "title": "hosts line",
        "status": "warn" if pat.search(line) else "pass",
        "detail": line[:160],
        "relatedOpId": "clear-suspicious-hosts" if pat.search(line) else "",
    })
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": f"Read /etc/hosts ({len(text.splitlines())} lines).",
    "checklist": checklist,
    "extra": {"hosts": text.splitlines()[:40]},
    "findings": findings,
}, indent=2))
PY
