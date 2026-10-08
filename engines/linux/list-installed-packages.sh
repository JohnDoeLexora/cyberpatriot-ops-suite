#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
dpkg-query -W -f='${Package}\t${Version}\n' 2>/dev/null | head -n 500 | python3 -c 'import json,sys; pkgs=[{"name":a,"version":b} for a,b in (l.strip().split("\t",1) for l in sys.stdin if l.strip())]; print(json.dumps({"ok":True,"packages":pkgs}))'
