#!/usr/bin/env bash
# Interactive accounts with no lastlog entry.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, pwd
nologin = {"/usr/sbin/nologin", "/sbin/nologin", "/bin/false", "/usr/bin/false"}
lastlog = os.environ.get("CP_LASTLOG", "/var/log/lastlog")
try:
    import subprocess
    out = subprocess.check_output(["lastlog"], text=True, stderr=subprocess.DEVNULL)
except Exception:
    out = ""
seen = set()
for line in out.splitlines()[1:]:
    parts = line.split()
    if not parts:
        continue
    if "**Never logged in**" in line:
        seen.add(parts[0])
users = []
for p in pwd.getpwall():
    if p.pw_shell in nologin or p.pw_uid < 1000 and p.pw_name != "root":
        continue
    if p.pw_name in seen or (not out and p.pw_uid >= 1000):
        if p.pw_name in seen or not out:
            users.append({"name": p.pw_name, "uid": p.pw_uid, "shell": p.pw_shell, "home": p.pw_dir, "passwordHidden": True, "platform": "linux", "groups": [], "lastLogin": None})
if not out:
    summary = "Skipped: lastlog is not available. Install it with: sudo apt-get install login"
    print(json.dumps({"ok": False, "status": "skipped", "summary": summary, "exitCode": 3, "users": []}, indent=2))
else:
    print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(users)} interactive accounts with no last login.", "users": users}, indent=2))
PY
