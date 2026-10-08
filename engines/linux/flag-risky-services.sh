#!/usr/bin/env bash
# Compare enabled units to config/risky-services.txt.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v systemctl >/dev/null 2>&1; then
  cp_skip "Skipped: systemctl is not installed. This check needs systemd."
fi
repo="$(cp_repo_root)"
cp_load_allowlist "${CP_RISKY_SERVICES:-${repo}/config/risky-services.txt}" 0
python3 - "${CP_ALLOW_NAMES[*]:-}" <<'PY'
import json, subprocess, sys
risky = set(sys.argv[1].split()) if len(sys.argv) > 1 and sys.argv[1] else set()
try:
    out = subprocess.check_output(["systemctl", "list-units", "--type=service", "--all", "--no-pager", "--no-legend", "--plain"], text=True, stderr=subprocess.DEVNULL)
except Exception as exc:
    print(json.dumps({"ok": False, "status": "error", "summary": f"systemctl failed: {exc}", "exitCode": 1}))
    raise SystemExit(0)
hits = []
for line in out.splitlines():
    cols = line.split()
    if len(cols) < 4:
        continue
    name = cols[0][:-8] if cols[0].endswith(".service") else cols[0]
    if name.lower() in risky or any(name.lower() == r.lower() for r in risky):
        active = cols[2]
        hits.append({"name": name, "state": "running" if active == "active" else "stopped", "enabled": False, "risky": True, "platform": "linux"})
print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(hits)} risky services enabled or present.", "services": hits}, indent=2))
PY
