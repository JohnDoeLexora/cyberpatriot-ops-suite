#!/usr/bin/env bash
# Read-only: unattend/sysprep leftovers. Password values never printed.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" files-sysprep && exit 0 || true
fi
find /home /root /tmp /opt /var/tmp -xdev -maxdepth 4 \( -iname '*unattend*' -o -iname '*sysprep.xml' -o -iname 'ks.cfg' \) 2>/dev/null | head -n 50 | python3 -c 'import json,sys; print(json.dumps({"ok":True,"files":[{"path":l.strip(),"note":"sysprep leftover"} for l in sys.stdin if l.strip()]}))'
