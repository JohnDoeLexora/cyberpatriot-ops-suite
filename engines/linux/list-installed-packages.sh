#!/usr/bin/env bash
# Installed packages. Read-only. Caps the table at 500 rows; the count in the summary is the cap.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v dpkg-query >/dev/null 2>&1; then
  cp_skip "Skipped: dpkg-query is not installed. This check is for Debian and Ubuntu images."
fi
# Read the whole list in Python so a cap does not SIGPIPE dpkg-query under pipefail.
dpkg-query -W -f='${Package}\t${Version}\n' 2>/dev/null | python3 -c 'import json,sys
lines=[l.strip() for l in sys.stdin if l.strip()]
rows=[]
for line in lines[:500]:
    name, _, ver = line.partition("\t")
    if name:
        rows.append({"name": name, "version": ver})
print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(rows)} packages.", "packages": rows}))
'
