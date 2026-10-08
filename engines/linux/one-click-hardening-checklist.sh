#!/usr/bin/env bash
# Read-only checklist. Does not change the image.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, shutil
root = os.environ.get("CP_ROOT", "")
def read(path):
    full = (root + path) if root else path
    try:
        return open(full, encoding="utf-8", errors="replace").read()
    except OSError:
        return ""
items = []
defs = read("/etc/login.defs")
items.append({"id": "maxdays", "title": "Password max age", "status": "pass" if "PASS_MAX_DAYS" in defs and "99999" not in defs else "warn", "detail": "See enforce-password-policy", "relatedOpId": "enforce-password-policy"})
sshd = read("/etc/ssh/sshd_config") + read("/etc/ssh/sshd_config.d/99-cp-hardening.conf")
root_login = "fail" if "PermitRootLogin yes" in sshd else "pass"
items.append({"id": "rootssh", "title": "Root SSH", "status": root_login, "detail": "PermitRootLogin", "relatedOpId": "disable-root-ssh"})
items.append({"id": "ufw", "title": "ufw present", "status": "pass" if shutil.which("ufw") else "warn", "detail": "Install ufw if this image should firewall itself", "relatedOpId": "enable-firewall"})
items.append({"id": "ccs", "title": "Scoring service not contacted", "status": "pass", "detail": "This checklist is local only.", "relatedOpId": "scoreboard-preflight"})
print(json.dumps({"ok": True, "status": "ok", "summary": f"Checklist of {len(items)} items. Nothing was changed.", "checklist": items}, indent=2))
PY
