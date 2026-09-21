#!/usr/bin/env bash
# Homepage/proxy/extension-id audit. No cookies or saved passwords.
set -euo pipefail
python3 - <<'PY'
import json, os, re
def read(p):
    try: return open(p, encoding="utf-8", errors="replace").read()
    except OSError: return ""
blob = "".join(read(p) for p in [
    "/etc/firefox/policies/policies.json",
    "/usr/lib/firefox/distribution/policies.json",
    "/etc/firefox/syspref.js",
    "/etc/chromium/policies/managed/policy.json",
])
findings = []
home = re.search(r'"URL"\s*:\s*"([^"]+)"', blob)
proxy = re.search(r'"HTTPProxy"\s*:\s*"([^"]+)"', blob)
if home and re.search(r"10\.|192\.168\.|pwn|hack", home.group(1), re.I):
    findings.append({"id":"home","severity":"high","title":"Unexpected browser homepage","detail":home.group(1)})
if proxy:
    findings.append({"id":"proxy","severity":"high","title":f"Browser proxy {proxy.group(1)}"})
print(json.dumps({"ok": True, "findings": findings, "extra": {"note": "Cookies/passwords not dumped"}}))
PY
