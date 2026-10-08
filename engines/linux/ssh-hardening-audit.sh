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
def phrase_root(value):
    low = value.lower()
    if low in {"no", "prohibit-password", "forced-commands-only", "without-password"}:
        return "SSH root login is disabled"
    if low == "yes":
        return "SSH root login is enabled"
    if low == "unset":
        return "SSH root login is unset"
    return f"SSH root login is {value}"

def phrase_password(value):
    low = value.lower()
    if low == "yes":
        return "password auth is on"
    if low == "no":
        return "password auth is off"
    if low == "unset":
        return "password auth is unset"
    return f"password auth is {value}"

if not p.exists():
    summary = "sshd_config is missing."
    tone = "watch"
elif not text:
    summary = "sshd_config could not be read."
    tone = "watch"
else:
    summary = f"{phrase_root(policy['PermitRootLogin'])}; {phrase_password(policy['PasswordAuthentication'])}"
    root_open = policy["PermitRootLogin"].lower() == "yes"
    empty = policy["PermitEmptyPasswords"].lower() == "yes"
    passwords = policy["PasswordAuthentication"].lower() == "yes"
    tone = "urgent" if root_open or empty else "watch" if passwords or policy["PermitRootLogin"].lower() == "unset" else "clear"
facts = [{"label": key, "value": value} for key, value in policy.items()]
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "policy": policy,
    "checklist": checklist,
    "findings": findings,
    "report": {"tone": tone, "facts": facts},
}, indent=2))
PY
