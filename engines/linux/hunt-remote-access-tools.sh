#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -z "${CP_SKIP_BEND:-}" && -z "${CP_SCAN_ROOT:-}" && -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-rats
  exit 0
fi
python3 - <<'PY'
import json, os
needles = ("teamviewer", "anydesk", "vnc", "rustdesk", "splashtop")
hits = []
for root in ("/opt", "/usr/local", "/usr/bin"):
    if not os.path.isdir(root):
        continue
    for name in os.listdir(root):
        low = name.lower()
        if any(n in low for n in needles):
            hits.append({"path": os.path.join(root, name), "note": "remote-access"})
print(json.dumps({"ok": True, "files": hits[:80]}, indent=2))
PY
