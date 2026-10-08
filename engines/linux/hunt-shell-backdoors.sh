#!/usr/bin/env bash
# Read-only: grep rc/profile files for alias hijacks and wget|sh plants. Does not execute them.
set -Eeuo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, re
from pathlib import Path
pat = re.compile(
    r"alias\s+(sudo|su|ls|cd|passwd|chmod|chown|ssh|login)\s*=|"
    r"nc\s+-e\s+/bin/(ba)?sh|wget.{0,80}\|\s*(ba)?sh|curl.{0,80}\|\s*(ba)?sh|"
    r"LD_PRELOAD=|unset\s+HISTFILE|/tmp/\.[A-Za-z0-9]",
    re.I,
)
files = ["/etc/profile", "/etc/bash.bashrc", "/etc/bashrc", "/root/.bashrc", "/root/.profile", "/root/.bash_aliases"]
pdir = Path("/etc/profile.d")
if pdir.is_dir():
    files.extend(str(p) for p in pdir.iterdir() if p.is_file())
home = Path("/home")
if home.is_dir():
    for user in home.iterdir():
        if user.is_dir():
            files.extend(str(user / rc) for rc in (".bashrc", ".profile", ".bash_aliases", ".zshrc"))
hits = []
for f in files:
    if not os.path.isfile(f):
        continue
    try:
        text = Path(f).read_text(encoding="utf-8", errors="replace")[:8000]
    except OSError:
        continue
    m = pat.search(text)
    if m:
        hits.append({"path": f, "note": m.group(0)[:160]})
n = len(hits)
if n == 0:
    summary = "No shell backdoors in rc or profile files"
    tone = "empty"
elif n == 1:
    summary = "1 shell backdoor in rc or profile files."
    tone = "watch"
else:
    summary = f"{n} shell backdoors in rc or profile files."
    tone = "watch"
print(json.dumps({
    "ok": True,
    "summary": summary,
    "files": hits,
    "note": "Read-only. rc files were not executed.",
    "report": {"tone": tone, "facts": [
        {"label": "Checked", "value": "/etc/profile, /etc/bash.bashrc, /root, /home"},
        {"label": "Found", "value": str(n)},
    ]},
}, indent=2))
PY
