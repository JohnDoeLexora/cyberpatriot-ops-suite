#!/usr/bin/env bash
# Permissions and a NOPASSWD flag. The rules themselves are not dumped.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, pathlib
paths = [pathlib.Path("/etc/sudoers"), *pathlib.Path("/etc/sudoers.d").glob("*")]
files = []
findings = []
nopasswd = False
unreadable = []
for p in paths:
    if not p.is_file():
        continue
    try:
        st = p.stat()
    except OSError:
        continue
    mode = format(st.st_mode & 0o7777, "04o")
    world = bool(st.st_mode & 0o002)
    text = ""
    try:
        text = p.read_text(errors="replace")
    except OSError:
        unreadable.append(str(p))
    else:
        nopasswd = nopasswd or "NOPASSWD" in text
    files.append({"path": str(p), "kind": "file", "mode": mode, "worldWritable": world})
    if world:
        findings.append({"id": f"ww:{p}", "severity": "critical", "title": f"World-writable {p}", "detail": f"mode {mode}", "resource": str(p)})
if nopasswd:
    findings.append({"id": "nopasswd", "severity": "high", "title": "NOPASSWD in sudoers", "detail": "Review /etc/sudoers. The rules are not dumped."})
summary = "Audited sudoers permissions and NOPASSWD (no full dump of rules)."
tone = "urgent" if findings else "clear"
if unreadable and not nopasswd:
    summary = "Audited sudoers modes. The file was not readable, so NOPASSWD was not checked and the rules were not dumped."
    tone = "watch"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "files": files,
    "findings": findings,
    "extra": {"nopasswdPresent": nopasswd, "unreadable": unreadable},
    "report": {
        "tone": tone,
        "facts": [
            {"label": "Files", "value": str(len(files))},
            {"label": "NOPASSWD", "value": "present" if nopasswd else "not found"},
            {"label": "Unreadable", "value": ", ".join(unreadable) if unreadable else "none"},
        ],
    },
}, indent=2))
PY
