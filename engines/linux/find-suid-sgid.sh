#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -z "${CP_SKIP_BEND:-}" && -z "${CP_SCAN_ROOT:-}" && -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-suid
  exit 0
fi
find / -xdev \( -perm -4000 -o -perm -2000 \) -type f -print 2>/dev/null | python3 -c 'import json,sys
lines=[l.strip() for l in sys.stdin if l.strip()][:200]
print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(lines)} SUID/SGID files (capped).", "files": [{"path": l, "kind": "file", "suid": True} for l in lines]}))
'
