#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-ww
  exit 0
fi
find /home /etc /opt /tmp /var /usr/local -xdev -perm -0002 -type f 2>/dev/null | head -n 200 | python3 -c 'import json,sys; print(json.dumps({"ok":True,"files":[{"path":l.strip(),"worldWritable":True} for l in sys.stdin if l.strip()]}))'
