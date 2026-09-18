#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-suid
  exit 0
fi
find / -xdev \( -perm -4000 -o -perm -2000 \) -type f 2>/dev/null | head -n 200 | python3 -c 'import json,sys; print(json.dumps({"ok":True,"files":[{"path":l.strip(),"suid":True} for l in sys.stdin if l.strip()]}))'
