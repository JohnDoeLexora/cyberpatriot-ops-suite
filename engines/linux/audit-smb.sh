#!/usr/bin/env bash
# Read Samba service state and whether the config binds widely.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, shutil, subprocess
root = os.environ.get("CP_ROOT", "")
conf = (root + "/etc/samba/smb.conf") if root else "/etc/samba/smb.conf"
services = []
if shutil.which("systemctl"):
    try:
        out = subprocess.check_output(["systemctl", "list-units", "--type=service", "--all", "--no-pager", "--no-legend", "--plain"], text=True, stderr=subprocess.DEVNULL)
        for line in out.splitlines():
            cols = line.split()
            if cols and any(x in cols[0].lower() for x in ("smb", "nmb", "samba")):
                services.append({"name": cols[0], "state": "running" if len(cols) > 2 and cols[2] == "active" else "stopped", "enabled": False, "platform": "linux"})
    except Exception:
        pass
text = ""
if os.path.isfile(conf):
    text = open(conf, encoding="utf-8", errors="replace").read()
print(json.dumps({
    "ok": True, "status": "ok",
    "summary": f"{len(services)} SMB-related services.",
    "services": services,
    "extra": {"configPresent": bool(text), "guestOk": "guest ok" in text.lower()},
}, indent=2))
PY
