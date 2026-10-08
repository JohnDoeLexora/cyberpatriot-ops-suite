#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
HERE="$(cd "$(dirname "$0")" && pwd)"
ZERO="No SUID or SGID files on this filesystem"
NOUN="SUID/SGID files"
SCOPE="/"
if [[ -z "${CP_SKIP_BEND:-}" && -z "${CP_SCAN_ROOT:-}" && -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-suid | cp_annotate_scan "$ZERO" "$NOUN" "$SCOPE"
  exit $?
fi
find / -xdev \( -perm -4000 -o -perm -2000 \) -type f -print 2>/dev/null | python3 -c 'import json,sys
lines=[l.strip() for l in sys.stdin if l.strip()][:200]
print(json.dumps({"ok": True, "status": "ok", "files": [{"path": l, "kind": "file", "suid": True} for l in lines]}))
' | cp_annotate_scan "$ZERO" "$NOUN" "$SCOPE"
