#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
HERE="$(cd "$(dirname "$0")" && pwd)"
ZERO="No media files under /home, /tmp, /var/tmp, /opt, /usr/local/share"
NOUN="media files"
SCOPE="/home, /tmp, /var/tmp, /opt, /usr/local/share"
if [[ -z "${CP_SKIP_BEND:-}" && -z "${CP_SCAN_ROOT:-}" && -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-media | cp_annotate_scan "$ZERO" "$NOUN" "$SCOPE"
  exit $?
fi
find /home /tmp /var/tmp /opt -type f \( -iname '*.mp3' -o -iname '*.mp4' -o -iname '*.avi' -o -iname '*.mkv' -o -iname '*.mov' -o -iname '*.flac' -o -iname '*.wav' -o -iname '*.ogg' \) -print 2>/dev/null | python3 -c 'import json,sys
lines=[l.strip() for l in sys.stdin if l.strip()][:200]
print(json.dumps({"ok": True, "status": "ok", "files": [{"path": l, "kind": "file", "note": "media"} for l in lines]}))
' | cp_annotate_scan "$ZERO" "$NOUN" "$SCOPE"
