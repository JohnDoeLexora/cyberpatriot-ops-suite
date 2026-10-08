#!/usr/bin/env bash
# Read-only Apache/nginx harden checklist. Does not disable the web server.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, re
files = [p for p in [
    "/etc/apache2/apache2.conf", "/etc/apache2/httpd.conf", "/etc/httpd/conf/httpd.conf",
    "/etc/apache2/conf-enabled/security.conf", "/etc/apache2/sites-enabled/000-default.conf",
    "/etc/nginx/nginx.conf", "/etc/nginx/sites-enabled/default",
] if os.path.isfile(p)]
blob = "\n".join(open(p, encoding="utf-8", errors="replace").read() for p in files)
checks = [
    ("indexes", "Directory listings", bool(re.search(r"Options\s+[^\n]*Indexes", blob, re.I) and not re.search(r"Options\s+[^\n]*-Indexes", blob, re.I))),
    ("servertokens", "ServerTokens not Prod", bool(re.search(r"ServerTokens\s+(OS|Full|Major|Minor)", blob, re.I))),
    ("signature", "ServerSignature On", bool(re.search(r"ServerSignature\s+On", blob, re.I))),
    ("autoindex", "nginx autoindex on", bool(re.search(r"autoindex\s+on", blob, re.I))),
]
findings = [{"id": i, "severity": "medium", "title": t} for i, t, bad in checks if bad]
n = len(findings)
if not files:
    summary = "No Apache or nginx config found"
    tone = "empty"
elif n == 1:
    summary = "Web server config has 1 issue"
    tone = "watch"
elif n:
    summary = f"Web server config has {n} issues"
    tone = "watch"
else:
    summary = "Web server config looks locked down"
    tone = "clear"
print(json.dumps({
    "ok": True,
    "summary": summary,
    "extra": {"files": files},
    "findings": findings,
    "report": {"tone": tone, "facts": [
        {"label": "Config files", "value": str(len(files))},
        {"label": "Issues", "value": str(n)},
    ]},
}))
PY
