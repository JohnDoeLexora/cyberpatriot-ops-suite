#!/usr/bin/env bash
# Report auditd. Skips when systemd or auditd is missing.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing.
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
rules_text=""
if command -v auditctl >/dev/null 2>&1; then
  rules_text="$(auditctl -l 2>&1 || true)"
fi
python3 - "$audit" "$enabled" "$rules_text" <<'PY'
import json, sys
audit, enabled, rules_text = (part.strip() for part in sys.argv[1:4])
rules = None
if rules_text and "permission denied" not in rules_text.lower() and "operation not permitted" not in rules_text.lower():
    lines = [line for line in rules_text.splitlines() if line.strip() and "no rules" not in line.lower()]
    rules = len(lines)
findings = []
if audit != "active":
    findings.append({"id": "auditd", "severity": "medium", "title": "auditd not active", "detail": f"active={audit} enabled={enabled}"})
if audit == "active":
    summary = f"auditd is running with {rules} rules" if rules is not None else "auditd is running"
    tone = "watch" if rules == 0 else "clear"
else:
    summary = "auditd is not running"
    tone = "watch"
facts = [
    {"label": "Status", "value": audit or "unknown"},
    {"label": "Boot", "value": enabled or "unknown"},
    {"label": "Rules", "value": "unreadable" if rules is None else str(rules)},
]
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "extra": {"auditd": audit, "enabled": enabled, "rules": rules},
    "findings": findings,
    "report": {"tone": tone, "facts": facts},
}, indent=2))
PY
