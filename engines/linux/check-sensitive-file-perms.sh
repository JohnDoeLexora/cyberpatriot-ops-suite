#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
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
n = len(files)
ww = sum(1 for item in files if item["worldWritable"])
if n == 0:
    summary = "No sensitive files were found to check"
    tone = "empty"
else:
    summary = f"Checked {n} sensitive files; {ww} are world-writable"
    tone = "urgent" if ww else "clear"
print(json.dumps({
    "ok": True,
    "summary": summary,
    "files": files,
    "report": {"tone": tone, "facts": [
        {"label": "Checked", "value": str(n)},
        {"label": "World-writable", "value": str(ww)},
    ]},
}, indent=2))
PY
