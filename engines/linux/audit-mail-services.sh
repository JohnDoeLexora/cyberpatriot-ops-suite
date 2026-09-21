#!/usr/bin/env bash
# Read-only postfix/exim/dovecot relay audit. Does not send mail.
set -euo pipefail
python3 - <<'PY'
import json, os, re
def read(p):
    try: return open(p, encoding="utf-8", errors="replace").read()
    except OSError: return ""
postfix = read("/etc/postfix/main.cf")
dovecot = read("/etc/dovecot/dovecot.conf") + read("/etc/dovecot/conf.d/10-auth.conf")
findings = []
mynet = re.findall(r"^\s*mynetworks\s*=\s*(.+)$", postfix, re.M)
if any("0.0.0.0/0" in m or "::/0" in m for m in mynet):
    findings.append({"id":"relay","severity":"critical","title":"Postfix mynetworks 0.0.0.0/0"})
if re.search(r"disable_vrfy_command\s*=\s*no", postfix):
    findings.append({"id":"vrfy","severity":"medium","title":"disable_vrfy_command=no"})
if re.search(r"disable_plaintext_auth\s*=\s*no", dovecot):
    findings.append({"id":"plain","severity":"high","title":"Dovecot plaintext auth allowed"})
print(json.dumps({"ok": True, "findings": findings, "extra": {"postfix": bool(postfix)}}))
PY
