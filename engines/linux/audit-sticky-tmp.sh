#!/usr/bin/env bash
# Read-only: sticky bit on /tmp /var/tmp /dev/shm plus world-writable temp dirs.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -z "${CP_SKIP_BEND:-}" && -z "${CP_SCAN_ROOT:-}" && -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-sticky && exit 0 || true
fi
python3 - <<'PY'
import json, os, stat
paths = ["/tmp", "/var/tmp", "/dev/shm"]
files, findings = [], []
for p in paths:
    try:
        st = os.stat(p)
    except OSError:
        continue
    mode = st.st_mode
    rec = {"path": p, "kind": "directory", "mode": format(mode & 0o7777, "04o"), "worldWritable": bool(mode & 0o0002)}
    files.append(rec)
    if (mode & 0o0002) and not (mode & 0o1000):
        findings.append({"id": f"sticky:{p}", "severity": "critical" if p == "/tmp" else "high", "title": f"{p} missing sticky bit", "resource": p})
print(json.dumps({"ok": True, "files": files, "findings": findings}))
PY
