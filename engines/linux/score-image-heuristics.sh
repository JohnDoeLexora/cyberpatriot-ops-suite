#!/usr/bin/env bash
# Local suspicion counts. Not the official score. No hashes.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, pwd
odd = []
nologin = {"/usr/sbin/nologin", "/sbin/nologin", "/bin/false", "/usr/bin/false"}
for p in pwd.getpwall():
    score = 0
    signals = []
    if p.pw_uid == 0 and p.pw_name != "root":
        score += 40
        signals.append("uid-zero")
    if p.pw_shell not in nologin and p.pw_shell not in {"/bin/bash", "/bin/sh"} and p.pw_uid >= 1000:
        score += 10
        signals.append("shell")
    if score:
        odd.append({"name": p.pw_name, "uid": p.pw_uid, "shell": p.pw_shell, "suspicionScore": score, "signals": signals, "passwordHidden": True, "platform": "linux", "groups": []})
print(json.dumps({
    "ok": True, "status": "ok",
    "summary": f"Local heuristic pass over {len(list(pwd.getpwall()))} accounts; {len(odd)} stood out. Not the official score.",
    "users": odd, "extra": {"ccsContacted": False},
}, indent=2))
PY
