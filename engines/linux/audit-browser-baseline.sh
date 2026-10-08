#!/usr/bin/env bash
# Read-only Firefox system policy. No cookies or saved passwords.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os
files = [p for p in ["/etc/firefox/policies/policies.json", "/usr/lib/firefox/distribution/policies.json", "/etc/firefox/syspref.js"] if os.path.isfile(p)]
print(json.dumps({"ok": True, "extra": {"files": files, "note": "cookies/history/passwords not dumped"}}))
PY
