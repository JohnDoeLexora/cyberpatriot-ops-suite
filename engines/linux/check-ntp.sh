#!/usr/bin/env bash
# Report time sync. Skips clearly when timedatectl is missing.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v timedatectl >/dev/null 2>&1; then
  cp_skip "Skipped: timedatectl is not installed. On Debian/Ubuntu it is in the systemd package."
fi
timed="$(timedatectl status 2>&1 || true)"
chron=""
if command -v chronyc >/dev/null 2>&1; then
  chron="$(chronyc tracking 2>&1 || true)"
fi
python3 - "$timed" "$chron" <<'PY'
import json, sys
timed, chron = sys.argv[1], sys.argv[2]
print(json.dumps({"ok": True, "status": "ok", "summary": "Time sync status.", "extra": {"timedatectl": timed[:2000], "chrony": chron[:1000]}}, indent=2))
PY
