#!/usr/bin/env bash
# Report auditd. Skips when systemd is missing.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v systemctl >/dev/null 2>&1; then
  cp_skip "Skipped: systemctl is not installed. auditd needs systemd on this image."
fi
audit="$(systemctl is-active auditd 2>/dev/null || true)"
enabled="$(systemctl is-enabled auditd 2>/dev/null || true)"
if [[ -z "$enabled" || "$enabled" == "not-found" ]]; then
  cp_skip "Skipped: auditd is not installed. Install it with: sudo apt-get install auditd"
fi
python3 - "$audit" "$enabled" <<'PY'
import json, sys
audit, enabled = sys.argv[1].strip(), sys.argv[2].strip()
findings = []
if audit != "active":
    findings.append({"id": "auditd", "severity": "medium", "title": "auditd not active", "detail": f"active={audit} enabled={enabled}"})
print(json.dumps({"ok": True, "status": "ok", "summary": f"auditd active={audit or 'unknown'} enabled={enabled}", "extra": {"auditd": audit, "enabled": enabled}, "findings": findings}, indent=2))
PY
