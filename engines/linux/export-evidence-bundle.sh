#!/usr/bin/env bash
# Redacted local counts. No hashes, no private keys, no CCS.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, pwd
users = [{
    "name": p.pw_name, "uid": p.pw_uid, "shell": p.pw_shell, "home": p.pw_dir,
    "passwordHidden": True, "platform": "linux", "groups": [],
} for p in pwd.getpwall()]
print(json.dumps({
    "ok": True, "status": "ok",
    "summary": f"Redacted evidence: {len(users)} accounts. Hashes and private keys omitted. CCS not contacted.",
    "users": users[:40],
    "extra": {"note": "Redacted live evidence. No shadow hashes, no private keys.", "ccsContacted": False, "hashesIncluded": False},
}, indent=2))
PY
