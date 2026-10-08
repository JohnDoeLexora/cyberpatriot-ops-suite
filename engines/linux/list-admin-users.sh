#!/usr/bin/env bash
# List UID 0 and sudo/wheel/admin members. Hashes are omitted.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import grp, json, pwd
priv = {"sudo", "wheel", "admin", "root"}
admins = []
for p in pwd.getpwall():
    groups = []
    try:
        groups = [g.gr_name for g in grp.getgrall() if p.pw_name in g.gr_mem or g.gr_gid == p.pw_gid]
    except Exception:
        groups = []
    if p.pw_uid == 0 or any(g.lower() in priv for g in groups):
        admins.append({
            "name": p.pw_name, "uid": p.pw_uid, "gid": p.pw_gid, "home": p.pw_dir,
            "shell": p.pw_shell, "groups": groups, "passwordHidden": True, "platform": "linux",
        })
print(json.dumps({
    "ok": True, "status": "ok",
    "summary": f"{len(admins)} privileged accounts (hashes omitted).",
    "users": admins,
}, indent=2))
PY
