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
        return subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True, timeout=5)
    except Exception:
        return ""
selinux = run(["getenforce"]).strip() or "unknown"
aa = run(["aa-status"])
print(json.dumps({"ok": True, "extra": {"selinux": selinux, "apparmor": aa[:1500]}}))
PY
