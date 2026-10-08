#!/usr/bin/env bash
# Hidden executables under CP_SCAN_ROOT or a few local trees.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, stat
root = os.environ.get("CP_SCAN_ROOT")
roots = [root] if root else ["/tmp", "/var/tmp", "/home", "/opt"]
hits = []
for base in roots:
    if not base or not os.path.isdir(base):
        continue
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = dirnames[:40]
        if dirpath.count(os.sep) - base.count(os.sep) > 3:
            dirnames[:] = []
            continue
        for name in filenames:
            if not name.startswith("."):
                continue
            path = os.path.join(dirpath, name)
            try:
                mode = os.stat(path).st_mode
            except OSError:
                continue
            if mode & 0o111:
                hits.append({"path": path, "kind": "file", "hidden": True, "note": "hidden executable"})
            if len(hits) >= 40:
                break
        if len(hits) >= 40:
            break
scope = ", ".join(base for base in roots if base) or "the scan roots"
n = len(hits)
if n == 0:
    summary = f"No hidden executables under {scope}"
    tone = "empty"
elif n == 1:
    summary = "1 hidden executable."
    tone = "watch"
else:
    summary = f"{n} hidden executables."
    tone = "watch"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "files": hits,
    "report": {"tone": tone, "facts": [
        {"label": "Checked", "value": scope},
        {"label": "Found", "value": str(n)},
    ]},
}, indent=2))
PY
