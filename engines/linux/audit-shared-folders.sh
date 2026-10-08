#!/usr/bin/env bash
# Read Samba share definitions. Local config only.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, re
root = os.environ.get("CP_ROOT", "")
conf = (root + "/etc/samba/smb.conf") if root else "/etc/samba/smb.conf"
shares, findings = [], []
if not os.path.isfile(conf):
    print(json.dumps({"ok": True, "status": "ok", "summary": "No smb.conf on this image.", "shares": []}))
    raise SystemExit(0)
text = open(conf, encoding="utf-8", errors="replace").read()
current = None
for line in text.splitlines():
    s = line.strip()
    m = re.match(r"\[(.+)\]", s)
    if m:
        current = {"name": m.group(1), "guest": False, "writable": False}
        if current["name"].lower() not in {"global", "homes", "printers"}:
            shares.append(current)
        else:
            current = None
        continue
    if current is None or "=" not in s or s.startswith("#"):
        continue
    k, v = [p.strip().lower() for p in s.split("=", 1)]
    if k in {"guest ok", "public"} and v in {"yes", "true"}:
        current["guest"] = True
    if k in {"writable", "writeable", "read only"} :
        current["writable"] = v in {"yes", "true"} if k != "read only" else v in {"no", "false"}
for share in shares:
    if share["guest"] or share["writable"]:
        findings.append({"id": f"share:{share['name']}", "severity": "high", "title": f"Share {share['name']} guest={share['guest']} writable={share['writable']}", "resource": share["name"]})
print(json.dumps({"ok": True, "status": "ok", "summary": f"{len(shares)} Samba shares.", "shares": shares, "findings": findings}, indent=2))
PY
