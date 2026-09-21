#!/usr/bin/env bash
set -euo pipefail
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
print(json.dumps({"ok": True, "findings": findings, "extra": {"journaldStorage": storage, "journalDir": journal}}))
PY
