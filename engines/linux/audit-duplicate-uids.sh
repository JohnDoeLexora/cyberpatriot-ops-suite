#!/usr/bin/env bash
# Report UID 0 besides root and duplicate UIDs.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, pwd
users = []
by_uid = {}
for p in pwd.getpwall():
    users.append({"name": p.pw_name, "uid": p.pw_uid, "shell": p.pw_shell, "home": p.pw_dir, "passwordHidden": True, "platform": "linux", "groups": []})
    by_uid.setdefault(p.pw_uid, []).append(p.pw_name)
findings = []
zeros = [u for u in users if u["uid"] == 0]
for u in zeros:
    if u["name"] != "root":
        findings.append({"id": f"uid0:{u['name']}", "severity": "critical", "title": f"Non-root UID 0: {u['name']}", "resource": u["name"]})
dups = 0
for uid, names in by_uid.items():
    if len(names) > 1 and uid != 0:
        dups += 1
        findings.append({"id": f"dup:{uid}", "severity": "high", "title": f"Duplicate UID {uid}", "detail": ", ".join(names)})
print(json.dumps({
    "ok": True, "status": "ok",
    "summary": f"{len(zeros)} UID 0 account(s); {dups} duplicate UID group(s).",
    "users": zeros, "findings": findings,
}, indent=2))
PY
