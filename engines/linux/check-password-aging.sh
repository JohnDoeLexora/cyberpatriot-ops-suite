#!/usr/bin/env bash
# Classify aging from login.defs and shadow metadata. Never prints hashes.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os
try:
    import spwd
except Exception:
    spwd = None
rows = []
if spwd is None:
    print(json.dumps({"ok": False, "status": "skipped", "summary": "Skipped: the spwd module is unavailable, so aging was not read.", "exitCode": 3}))
    raise SystemExit(0)
try:
    entries = spwd.getspall()
except Exception as exc:
    print(json.dumps({"ok": False, "status": "skipped", "summary": f"Skipped: shadow is unreadable. Re-run with sudo. {exc}", "exitCode": 3}))
    raise SystemExit(0)
for s in entries:
    field = s.sp_pwd or ""
    rows.append({
        "name": s.sp_nam,
        "maxDays": s.sp_max,
        "passwordEmpty": field == "",
        "locked": field.startswith("!") or field.startswith("*"),
        "passwordHidden": True,
        "neverExpires": s.sp_max in (-1, 99999),
    })
never = [r for r in rows if r["neverExpires"] and not r["locked"]]
names = ", ".join(row["name"] for row in never[:12]) or "none"
if len(never) == 0:
    summary = "No unlocked accounts have password aging disabled (hashes omitted)."
    tone = "clear"
elif len(never) == 1:
    summary = "1 unlocked account has password aging disabled (hashes omitted)."
    tone = "watch"
else:
    summary = f"{len(never)} unlocked accounts have password aging disabled (hashes omitted)."
    tone = "watch"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "extra": {"neverExpires": [row["name"] for row in never[:40]]},
    "report": {
        "tone": tone,
        "facts": [
            {"label": "Unlocked without aging", "value": str(len(never))},
            {"label": "Accounts", "value": names},
        ],
    },
}, indent=2))
PY
