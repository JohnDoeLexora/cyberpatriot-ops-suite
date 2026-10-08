#!/usr/bin/env bash
# Simulate apt upgrade. Does not install anything.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if [[ "${CP_FAST:-0}" == "1" ]]; then
  cp_skip "Skipped: CP_FAST=1 set, so apt-get -s upgrade was not run."
fi
if ! command -v apt-get >/dev/null 2>&1; then
  cp_skip "Skipped: apt-get is not installed. This check simulates upgrades with apt-get -s upgrade."
fi
sim="$(apt-get -s upgrade 2>/dev/null || true)"
python3 - "$sim" <<'PY'
import json, sys
lines = [ln for ln in sys.argv[1].splitlines() if ln.startswith("Inst ")]
print(json.dumps({
    "ok": True, "status": "ok",
    "summary": f"{len(lines)} simulated upgrades pending.",
    "extra": {"pending": lines[:40]},
    "findings": ([{"id": "updates", "severity": "medium", "title": f"{len(lines)} packages would upgrade", "remediationOpId": "apply-security-updates"}] if lines else []),
}, indent=2))
PY
