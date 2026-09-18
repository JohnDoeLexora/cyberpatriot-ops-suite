#!/usr/bin/env bash
set -euo pipefail
dpkg-query -W -f='${Package}\t${Version}\n' 2>/dev/null | head -n 500 | python3 -c 'import json,sys; pkgs=[{"name":a,"version":b} for a,b in (l.strip().split("\t",1) for l in sys.stdin if l.strip())]; print(json.dumps({"ok":True,"packages":pkgs}))'
