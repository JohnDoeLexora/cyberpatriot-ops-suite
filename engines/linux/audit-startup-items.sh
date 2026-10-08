#!/usr/bin/env bash
# Enabled units and rc.local. Read-only.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
enabled=""
if command -v systemctl >/dev/null 2>&1; then
  enabled="$(systemctl list-unit-files --state=enabled --no-pager --no-legend 2>/dev/null || true)"
else
  cp_warn "systemctl is not installed; only rc.local was checked."
fi
python3 - "$enabled" <<'PY'
import json, os, sys
root = os.environ.get("CP_ROOT", "")
rc_path = (root + "/etc/rc.local") if root else "/etc/rc.local"
rc = open(rc_path, encoding="utf-8", errors="replace").read() if os.path.isfile(rc_path) else ""
findings = []
if any(tok in rc for tok in ("/tmp/", "python3 -c", "python -c")):
    findings.append({"id": "rclocal", "severity": "high", "title": "Suspicious /etc/rc.local", "detail": "Looks like a temp-path or interpreter plant."})
enabled = [ln for ln in sys.argv[1].splitlines() if ln.strip()][:80]
suspicious = bool(findings)
if suspicious:
    summary = "Startup items include a suspicious rc.local"
    tone = "urgent"
elif enabled:
    summary = f"{len(enabled)} units enabled at boot"
    tone = "info"
else:
    summary = "No enabled units were listed; rc.local was checked"
    tone = "info"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "extra": {"enabled": enabled, "rcLocal": rc[:1500]},
    "findings": findings,
    "report": {
        "tone": tone,
        "facts": [
            {"label": "Enabled units", "value": str(len(enabled))},
            {"label": "rc.local", "value": "suspicious" if suspicious else "present" if rc.strip() else "absent"},
        ],
    },
}, indent=2))
PY
