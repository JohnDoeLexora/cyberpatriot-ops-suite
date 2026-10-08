#!/usr/bin/env bash
# Check whether auditd and rsyslog are active.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
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
summary = f"auditd={audit or 'unknown'} rsyslog={rsyslog or 'unknown'}"
print(json.dumps({"ok": True, "status": "ok", "summary": summary, "extra": {"auditd": audit, "rsyslog": rsyslog}, "findings": findings}, indent=2))
PY
