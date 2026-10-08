#!/usr/bin/env bash
# Read-only: sticky bit on /tmp /var/tmp /dev/shm plus world-writable temp dirs.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
HERE="$(cd "$(dirname "$0")" && pwd)"
ZERO="No sticky-bit problems under /tmp, /var/tmp, /dev/shm"
NOUN="sticky-bit problems"
SCOPE="/tmp, /var/tmp, /dev/shm"
if [[ -z "${CP_SKIP_BEND:-}" && -z "${CP_SCAN_ROOT:-}" && -x "$HERE/../bend/run.sh" ]]; then
  if "$HERE/../bend/run.sh" files-sticky | cp_annotate_scan "$ZERO" "$NOUN" "$SCOPE" "missing-sticky"; then
    exit 0
  fi
fi
python3 - <<'PY' | cp_annotate_scan "$ZERO" "$NOUN" "$SCOPE" "missing-sticky"
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
