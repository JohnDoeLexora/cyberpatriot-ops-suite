#!/usr/bin/env bash
# Flag unusual login shells. Does not change accounts.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, pwd
standard = {
    "/bin/bash", "/bin/sh", "/usr/bin/bash", "/usr/bin/sh", "/bin/zsh", "/usr/bin/zsh",
    "/bin/dash", "/usr/sbin/nologin", "/sbin/nologin", "/bin/false", "/usr/bin/false",
    "/usr/bin/fish", "/bin/rbash",
}
odd = []
users = []
for p in pwd.getpwall():
    rec = {"name": p.pw_name, "uid": p.pw_uid, "shell": p.pw_shell, "home": p.pw_dir, "passwordHidden": True, "platform": "linux", "groups": []}
    users.append(rec)
    if p.pw_shell not in standard:
        odd.append(rec)
findings = [{"id": f"shell:{u['name']}", "severity": "medium", "title": f"Unusual shell: {u['name']}", "detail": u["shell"], "resource": u["name"]} for u in odd]
print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(odd)} unusual shells.", "users": users, "findings": findings}, indent=2))
PY
