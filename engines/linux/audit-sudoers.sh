#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json, os, pathlib
paths = [pathlib.Path("/etc/sudoers"), *pathlib.Path("/etc/sudoers.d").glob("*")]
files = []
nopasswd = False
for p in paths:
    if not p.is_file():
        continue
    st = p.stat()
    text = p.read_text(errors="replace")
    nopasswd = nopasswd or "NOPASSWD" in text
    files.append({"path": str(p), "mode": format(st.st_mode & 0o7777, "04o"), "worldWritable": bool(st.st_mode & 0o002)})
print(json.dumps({"ok": True, "files": files, "extra": {"nopasswdPresent": nopasswd}}, indent=2))
PY
