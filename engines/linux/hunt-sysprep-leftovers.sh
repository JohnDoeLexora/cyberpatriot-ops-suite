#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -z "${CP_SKIP_BEND:-}" && -z "${CP_SCAN_ROOT:-}" && -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-sysprep
  exit 0
fi
find /home /root /tmp /opt /var/tmp -xdev -maxdepth 4 \( -iname '*unattend*' -o -iname '*sysprep.xml' -o -iname 'ks.cfg' \) -print 2>/dev/null | python3 -c 'import json,sys
lines=[l.strip() for l in sys.stdin if l.strip()][:50]
print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(lines)} sysprep leftovers (capped).", "files": [{"path": l, "kind": "file", "note": "sysprep leftover"} for l in lines]}))
'
