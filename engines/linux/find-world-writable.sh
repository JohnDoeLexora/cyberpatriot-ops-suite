#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
HERE="$(cd "$(dirname "$0")" && pwd)"
ZERO="No world-writable files under /home, /etc, /opt, /tmp, /var, /usr/local"
NOUN="world-writable files"
SCOPE="/home, /etc, /opt, /tmp, /var, /usr/local"
if [[ -z "${CP_SKIP_BEND:-}" && -z "${CP_SCAN_ROOT:-}" && -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-ww | cp_annotate_scan "$ZERO" "$NOUN" "$SCOPE"
  exit $?
fi
# Python reads the whole find stream so head's SIGPIPE cannot fail the script under pipefail.
find /home /etc /opt /tmp /var /usr/local -xdev -perm -0002 -type f -print 2>/dev/null | python3 -c 'import json,sys
lines=[l.strip() for l in sys.stdin if l.strip()][:200]
print(json.dumps({"ok": True, "status": "ok", "files": [{"path": l, "kind": "file", "worldWritable": True} for l in lines]}))
' | cp_annotate_scan "$ZERO" "$NOUN" "$SCOPE"
