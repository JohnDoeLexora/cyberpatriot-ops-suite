#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json, os, stat
paths = ["/etc/passwd", "/etc/shadow", "/etc/gshadow", "/etc/group", "/etc/sudoers", "/etc/ssh/sshd_config", "/etc/crontab"]
files = []
for p in paths:
    try:
        st = os.stat(p)
        mode = st.st_mode & 0o7777
        files.append({
            "path": p,
            "mode": format(mode, "04o"),
            "worldWritable": bool(mode & 0o002),
        })
    except FileNotFoundError:
        pass
print(json.dumps({"ok": True, "files": files}, indent=2))
PY
