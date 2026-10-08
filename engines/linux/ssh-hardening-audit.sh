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
keys = ("PermitRootLogin", "PermitEmptyPasswords", "X11Forwarding", "PasswordAuthentication", "Protocol", "MaxAuthTries")
policy = {k: pick(k) for k in keys}
bad = {
    "PermitRootLogin": lambda v: v.lower() == "yes",
    "PermitEmptyPasswords": lambda v: v.lower() == "yes",
    "X11Forwarding": lambda v: v.lower() == "yes",
    "Protocol": lambda v: v.strip() == "1",
}
checklist = []
findings = []
for key, value in policy.items():
    if key in bad and bad[key](value):
        status = "fail"
    elif value == "unset":
        status = "warn"
    else:
        status = "pass"
    checklist.append({
        "id": key,
        "title": key,
        "status": status,
        "detail": value,
        "relatedOpId": "harden-sshd" if status != "pass" else "",
    })
    if status == "fail":
        findings.append({
            "id": key,
            "severity": "critical" if key == "PermitEmptyPasswords" else "high",
            "title": f"{key} {value}",
            "detail": "From /etc/ssh/sshd_config. The rest of the file is not dumped.",
            "remediationOpId": "harden-sshd",
        })
summary = "Parsed sshd_config." if text else "sshd_config is missing."
print(json.dumps({"ok": True, "status": "ok", "summary": summary, "policy": policy, "checklist": checklist, "findings": findings}, indent=2))
PY
