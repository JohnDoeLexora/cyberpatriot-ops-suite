#!/usr/bin/env bash
# List at jobs. Read-only.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v atq >/dev/null 2>&1; then
  cp_skip "Skipped: atq is not installed. Install it with: sudo apt-get install at"
fi
jobs="$(atq 2>/dev/null || true)"
python3 - "$jobs" <<'PY'
import json, sys
lines = [ln for ln in sys.argv[1].splitlines() if ln.strip()]
print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(lines)} at job(s).", "extra": {"atq": lines}}, indent=2))
PY
