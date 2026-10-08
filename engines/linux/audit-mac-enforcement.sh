#!/usr/bin/env bash
# Read-only: AppArmor / SELinux mode. Does not setenforce.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, shutil, subprocess
def run(cmd):
    if not shutil.which(cmd[0]):
        return ""
    try:
        return subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True, timeout=8)
    except Exception as exc:
        return str(exc)
selinux = run(["getenforce"]).strip() or "not installed"
aa = run(["aa-status"])
enforce = complain = "unknown"
if aa:
    en = __import__("re").search(r"(\d+)\s+profiles are in enforce mode", aa)
    co = __import__("re").search(r"(\d+)\s+profiles are in complain mode", aa)
    if en:
        enforce = en.group(1)
    if co:
        complain = co.group(1)
sel_low = selinux.lower()
if "enforcing" in sel_low:
    summary = "SELinux is enforcing"
    tone = "clear"
elif "permissive" in sel_low:
    summary = "SELinux is permissive"
    tone = "watch"
elif enforce != "unknown":
    summary = f"AppArmor has {enforce} enforcing profiles and {complain} complain profiles"
    tone = "watch" if complain not in {"0", "unknown"} else "clear"
elif aa:
    summary = "AppArmor status was read"
    tone = "info"
else:
    summary = "No SELinux or AppArmor status tool was found"
    tone = "watch"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "extra": {"selinux": selinux, "apparmor": aa[:1500]},
    "report": {
        "tone": tone,
        "facts": [
            {"label": "SELinux", "value": selinux},
            {"label": "AppArmor enforcing", "value": enforce},
            {"label": "AppArmor complain", "value": complain},
        ],
    },
}, indent=2))
PY
