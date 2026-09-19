#!/usr/bin/env bash
# Read-only: vsftpd/proftpd anonymous knobs. Does not log in.
set -euo pipefail
python3 - <<'PY'
import json, os, re
files = [p for p in ["/etc/vsftpd.conf", "/etc/vsftpd/vsftpd.conf", "/etc/proftpd/proftpd.conf"] if os.path.isfile(p)]
blob = ""
for p in files:
    blob += open(p, encoding="utf-8", errors="replace").read() + "\n"
def pick(key):
    m = list(re.finditer(rf"(?im)^\s*{key}\s*=\s*(\S+)", blob))
    return m[-1].group(1) if m else None
cfg = {k: pick(k) for k in ["anonymous_enable", "write_enable", "anon_upload_enable", "chroot_local_user", "ssl_enable"]}
findings = []
if (cfg.get("anonymous_enable") or "").lower() in {"yes", "on", "1"}:
    findings.append({"id": "anon", "severity": "high", "title": "anonymous_enable=YES", "remediationOpId": "harden-vsftpd"})
if (cfg.get("anon_upload_enable") or "").lower() in {"yes", "on", "1"}:
    findings.append({"id": "anonup", "severity": "critical", "title": "anon_upload_enable=YES", "remediationOpId": "harden-vsftpd"})
print(json.dumps({"ok": True, "extra": {"vsftpd": cfg, "files": files}, "findings": findings}))
PY
