#!/usr/bin/env bash
# Homepage/proxy/extension-id audit. No cookies or saved passwords.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
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
n = len(findings)
if n:
    summary = "Browser policy has 1 unexpected setting" if n == 1 else f"Browser policy has {n} unexpected settings"
    tone = "urgent"
elif not blob.strip():
    summary = "No browser policy files found (cookies not dumped)"
    tone = "empty"
else:
    summary = "Browser homepage and proxy look normal (cookies not dumped)"
    tone = "clear"
print(json.dumps({
    "ok": True,
    "summary": summary,
    "findings": findings,
    "extra": {"note": "Cookies/passwords not dumped"},
    "report": {"tone": tone, "facts": [
        {"label": "Issues", "value": str(n)},
        {"label": "Cookies", "value": "not dumped"},
    ]},
}))
PY
