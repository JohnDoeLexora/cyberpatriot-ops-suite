#!/usr/bin/env bash
# List snap/flatpak leftovers. Does not uninstall.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
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
n, bad = len(apps), len(findings)
if n == 0:
    summary = "No snap or flatpak apps found"
    tone = "empty"
elif bad == 1:
    summary = "1 suspicious snap or flatpak app"
    tone = "watch"
elif bad:
    summary = f"{bad} suspicious snap or flatpak apps"
    tone = "watch"
else:
    summary = f"{n} snap or flatpak apps; none look suspicious"
    tone = "clear"
print(json.dumps({
    "ok": True,
    "summary": summary,
    "findings": findings,
    "extra": {"apps": apps},
    "report": {"tone": tone, "facts": [
        {"label": "Apps", "value": str(n)},
        {"label": "Suspicious", "value": str(bad)},
    ]},
}))
PY
