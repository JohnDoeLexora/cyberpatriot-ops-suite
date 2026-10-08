#!/usr/bin/env bash
# Read login.defs password aging. No hashes.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, re
root = os.environ.get("CP_ROOT", "")
path = (root + "/etc/login.defs") if root else "/etc/login.defs"
try:
    text = open(path, encoding="utf-8", errors="replace").read()
except OSError as exc:
    print(json.dumps({"ok": False, "status": "skipped", "summary": f"Skipped: cannot read {path}. {exc}", "exitCode": 3}))
    raise SystemExit(0)
policy = {}
for line in text.splitlines():
    s = line.strip()
    if not s or s.startswith("#"):
        continue
    m = re.match(r"^(PASS_[A-Z_]+)\s+(\S+)", s)
    if m:
        policy[m.group(1)] = m.group(2)
findings = []
try:
    if int(policy.get("PASS_MAX_DAYS", "0")) > 365:
        findings.append({"id": "maxdays", "severity": "medium", "title": f"PASS_MAX_DAYS={policy.get('PASS_MAX_DAYS')}", "detail": "Aging is effectively disabled.", "remediationOpId": "enforce-password-policy"})
except ValueError:
    pass
try:
    if int(policy.get("PASS_MIN_LEN", "99")) < 14:
        findings.append({"id": "minlen", "severity": "high", "title": f"PASS_MIN_LEN={policy.get('PASS_MIN_LEN')}", "detail": "Typical CP baseline is at least 14.", "remediationOpId": "enforce-password-policy"})
except ValueError:
    pass
print(json.dumps({"ok": True, "status": "ok", "summary": "Read login.defs (no hashes).", "policy": policy, "findings": findings}, indent=2))
PY
