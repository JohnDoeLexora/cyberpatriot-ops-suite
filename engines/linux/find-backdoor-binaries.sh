#!/usr/bin/env bash
# Look for netcat-like names under CP_SCAN_ROOT or local trees.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os
root = os.environ.get("CP_SCAN_ROOT")
roots = [root] if root else ["/tmp", "/home", "/opt", "/usr/local"]
names = {"nc", "ncat", "netcat", "socat"}
hits = []
for base in roots:
    if not base or not os.path.isdir(base):
        continue
    for dirpath, dirnames, filenames in os.walk(base):
        if dirpath.count(os.sep) - base.count(os.sep) > 3:
            dirnames[:] = []
            continue
        for name in filenames:
            if name in names or name.startswith("."):
                path = os.path.join(dirpath, name)
                try:
                    mode = os.stat(path).st_mode
                except OSError:
                    continue
                if name in names or (name.startswith(".") and mode & 0o111):
                    hits.append({"path": path, "kind": "file", "note": "suspicious binary"})
            if len(hits) >= 40:
                break
print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(hits)} suspicious binaries.", "files": hits}, indent=2))
PY
