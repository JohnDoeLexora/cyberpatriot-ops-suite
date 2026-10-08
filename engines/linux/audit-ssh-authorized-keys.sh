#!/usr/bin/env bash
# List authorized_keys paths. Does not print key material.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, pwd
files = []
for p in pwd.getpwall():
    path = os.path.join(p.pw_dir, ".ssh", "authorized_keys")
    if os.path.isfile(path):
        mode = os.stat(path).st_mode
        files.append({"path": path, "kind": "file", "mode": format(mode & 0o7777, "04o"), "owner": p.pw_name, "note": "key material not dumped"})
print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(files)} authorized_keys files (key material not dumped).", "files": files}, indent=2))
PY
