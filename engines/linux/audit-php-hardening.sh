#!/usr/bin/env bash
# Read-only PHP ini audit. info.php contents not dumped.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, re, glob
def read(p):
    try: return open(p, encoding="utf-8", errors="replace").read()
    except OSError: return ""
ini = "".join(read(p) for p in glob.glob("/etc/php/*/apache2/php.ini")+glob.glob("/etc/php/*/fpm/php.ini")+["/etc/php.ini"])
def kv(k, default=""):
    m = re.findall(rf"^\s*{k}\s*=\s*(\S+)", ini, re.M|re.I)
    return m[-1] if m else default
findings = []
if kv("expose_php","On").lower() in ("on","1"):
    findings.append({"id":"expose","severity":"medium","title":"expose_php=On"})
if kv("allow_url_include","Off").lower() in ("on","1"):
    findings.append({"id":"include","severity":"high","title":"allow_url_include=On"})
info = [os.path.join(r,n) for r in ("/var/www/html","/var/www") if os.path.isdir(r)
        for n in os.listdir(r) if n.lower() in ("info.php","phpinfo.php")]
for p in info:
    findings.append({"id":f"info:{p}","severity":"medium","title":"phpinfo helper present","resource":p})
n = len(findings)
if not ini.strip() and not info:
    summary = "No PHP config found"
    tone = "empty"
elif n:
    summary = "PHP hardening found 1 issue" if n == 1 else f"PHP hardening found {n} issues"
    tone = "urgent" if any(item["severity"] in {"critical", "high"} for item in findings) else "watch"
else:
    summary = "PHP config looks locked down"
    tone = "clear"
print(json.dumps({
    "ok": True,
    "summary": summary,
    "findings": findings,
    "extra": {"infoPhp": info},
    "report": {"tone": tone, "facts": [
        {"label": "expose_php", "value": kv("expose_php", "unset") or "unset"},
        {"label": "allow_url_include", "value": kv("allow_url_include", "unset") or "unset"},
        {"label": "info.php files", "value": str(len(info))},
    ]},
}))
PY
