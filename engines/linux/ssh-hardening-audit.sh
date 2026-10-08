#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, pathlib, re
p = pathlib.Path("/etc/ssh/sshd_config")
text = p.read_text() if p.exists() else ""
def pick(key):
    matches = re.findall(rf"^\s*{key}\s+(\S+)", text, flags=re.I | re.M)
    return matches[-1] if matches else "unset"
policy = {k: pick(k) for k in ("PermitRootLogin", "PermitEmptyPasswords", "X11Forwarding", "PasswordAuthentication", "Protocol", "MaxAuthTries")}
print(json.dumps({"ok": True, "policy": policy}, indent=2))
PY
