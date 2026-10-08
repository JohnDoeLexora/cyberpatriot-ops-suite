#!/usr/bin/env bash
# Check home directory modes. Read-only.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, pwd, stat
files, findings = [], []
for p in pwd.getpwall():
    home = p.pw_dir
    if not home or not os.path.isdir(home):
        continue
    mode = os.stat(home).st_mode
    rec = {"path": home, "kind": "directory", "mode": format(mode & 0o7777, "04o"), "owner": p.pw_name, "worldWritable": bool(mode & stat.S_IWOTH)}
    files.append(rec)
    if rec["worldWritable"]:
        findings.append({"id": f"home:{home}", "severity": "high", "title": f"Unsafe home {home}", "detail": f"mode {rec['mode']}", "resource": home})
print(json.dumps({"ok": True, "status": "ok", "summary": f"Checked {len(files)} home directories.", "files": files, "findings": findings}, indent=2))
PY
