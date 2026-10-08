#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, re
def read(p):
    try: return open(p, encoding="utf-8", errors="replace").read()
    except OSError: return ""
conf = read("/etc/systemd/journald.conf")
m = re.findall(r"^\s*Storage\s*=\s*(\S+)", conf, re.M)
storage = m[-1] if m else "auto"
journal = os.path.isdir("/var/log/journal")
findings = []
if storage.lower() == "volatile" or (not journal and storage.lower() == "auto"):
    findings.append({"id":"volatile","severity":"high","title":f"journald Storage={storage}"})
persistent = storage.lower() not in {"volatile"} and (journal or storage.lower() == "persistent")
if findings:
    summary = f"Journald storage is {storage} and may not persist"
    tone = "urgent"
elif storage.lower() == "persistent" or journal:
    summary = f"Journald storage is {storage}"
    tone = "clear"
else:
    summary = f"Journald storage is {storage}"
    tone = "info"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "findings": findings,
    "extra": {"journaldStorage": storage, "journalDir": journal},
    "report": {
        "tone": tone,
        "facts": [
            {"label": "Storage", "value": storage},
            {"label": "Persistent directory", "value": "present" if journal else "absent"},
        ],
    },
}))
PY
