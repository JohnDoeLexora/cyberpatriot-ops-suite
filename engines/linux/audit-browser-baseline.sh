#!/usr/bin/env bash
# Read-only Firefox system policy. No cookies or saved passwords.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os
files = [p for p in ["/etc/firefox/policies/policies.json", "/usr/lib/firefox/distribution/policies.json", "/etc/firefox/syspref.js"] if os.path.isfile(p)]
n = len(files)
if n == 0:
    summary = "No Firefox system policy files found (cookies not dumped)"
    tone = "empty"
elif n == 1:
    summary = "1 Firefox policy file found (cookies not dumped)"
    tone = "info"
else:
    summary = f"{n} Firefox policy files found (cookies not dumped)"
    tone = "info"
print(json.dumps({
    "ok": True,
    "summary": summary,
    "extra": {"files": files, "note": "cookies/history/passwords not dumped"},
    "report": {"tone": tone, "facts": [
        {"label": "Policy files", "value": str(n)},
        {"label": "Cookies", "value": "not dumped"},
    ]},
}))
PY
