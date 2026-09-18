#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json, os
path = "/etc/samba/smb.conf"
shares = []
if os.path.isfile(path):
    current = None
    for raw in open(path, encoding="utf-8", errors="replace"):
        line = raw.strip()
        if line.startswith("[") and line.endswith("]"):
            if current and current["name"] != "global":
                shares.append(current)
            current = {"name": line[1:-1]}
            continue
        if not current or not line or line.startswith("#") or line.startswith(";"):
            continue
        if "=" not in line:
            continue
        key, val = line.split("=", 1)
        key, val = key.strip().lower(), val.strip()
        if key == "path":
            current["path"] = val
        if key == "guest ok" and val.lower() == "yes":
            current["guest"] = True
        if key in {"writable", "writeable"} and val.lower() == "yes":
            current["writable"] = True
        if key == "read only" and val.lower() == "no":
            current["writable"] = True
    if current and current["name"] != "global":
        shares.append(current)
print(json.dumps({"ok": True, "shares": shares}, indent=2))
PY
