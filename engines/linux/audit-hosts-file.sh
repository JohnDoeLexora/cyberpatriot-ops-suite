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
    raise SystemExit(0)
pat = re.compile(r"windowsupdate|microsoft\.com|virustotal|avast|avg|google\.com|facebook", re.I)
findings = []
if pat.search(text):
    findings.append({"id": "hosts", "severity": "medium", "title": "Suspicious hosts redirects", "detail": "The hosts file mentions vendor or update names."})
lines = text.splitlines()[:40]
print(json.dumps({"ok": True, "status": "ok", "summary": "Read /etc/hosts.", "extra": {"hosts": lines}, "findings": findings}, indent=2))
PY
