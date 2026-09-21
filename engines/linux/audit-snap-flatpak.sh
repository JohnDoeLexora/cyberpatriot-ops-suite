#!/usr/bin/env bash
# List snap/flatpak leftovers. Does not uninstall.
set -euo pipefail
python3 - <<'PY'
import json, re, subprocess
def run(cmd):
    try:
        return subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL, timeout=8)
    except Exception:
        return ""
flag = re.compile(r"steam|discord|skype|zoom|wine|vlc|anydesk|teamviewer|spotify|minecraft", re.I)
apps = []
for line in run(["snap","list"]).splitlines()[1:]:
    name = line.split()[0] if line.strip() else ""
    if name and name not in ("snapd","bare","core","core20","core22","core24","gtk-common-themes"):
        apps.append({"kind":"snap","name":name,"suspicious":bool(flag.search(name))})
for line in run(["flatpak","list","--columns=application"]).splitlines():
    name = line.strip()
    if name:
        apps.append({"kind":"flatpak","name":name,"suspicious":bool(flag.search(name))})
findings = [{"id":f"{a['kind']}:{a['name']}","severity":"medium","title":f"{a['kind']} {a['name']}"} for a in apps if a["suspicious"]]
print(json.dumps({"ok": True, "findings": findings, "extra": {"apps": apps}}))
PY
