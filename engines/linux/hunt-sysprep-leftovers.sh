#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
HERE="$(cd "$(dirname "$0")" && pwd)"
ZERO="No sysprep leftovers under /home, /root, /tmp, /opt, /var/tmp"
NOUN="sysprep leftovers"
SCOPE="/home, /root, /tmp, /opt, /var/tmp"
if [[ -z "${CP_SKIP_BEND:-}" && -z "${CP_SCAN_ROOT:-}" && -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-sysprep | cp_annotate_scan "$ZERO" "$NOUN" "$SCOPE"
  exit $?
fi
find /home /root /tmp /opt /var/tmp -xdev -maxdepth 4 \( -iname '*unattend*' -o -iname '*sysprep.xml' -o -iname 'ks.cfg' \) -print 2>/dev/null | python3 -c 'import json,sys
lines=[l.strip() for l in sys.stdin if l.strip()][:50]
print(json.dumps({"ok": True, "status": "ok", "files": [{"path": l, "kind": "file", "note": "sysprep leftover"} for l in lines]}))
' | cp_annotate_scan "$ZERO" "$NOUN" "$SCOPE"
