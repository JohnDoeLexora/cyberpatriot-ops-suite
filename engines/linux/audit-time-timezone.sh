#!/usr/bin/env bash
# Read-only timezone and configured NTP servers. Does not change the clock.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os, re
def read(path):
    try:
        return open(path, encoding="utf-8", errors="replace").read()
    except OSError:
        return ""
tz = read("/etc/timezone").strip() or "unknown"
blob = read("/etc/systemd/timesyncd.conf") + read("/etc/chrony/chrony.conf") + read("/etc/ntp.conf")
servers = re.findall(r"^\s*(?:NTP|server|pool)\s*=?\s*(\S+)", blob, re.M)
findings = []
for server in servers:
    if re.match(r"^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)", server):
        findings.append({"id": f"ntp:{server}", "severity": "high", "title": f"Unexpected NTP server {server}"})
if findings:
    word = "server" if len(findings) == 1 else "servers"
    summary = f"Timezone is {tz}; {len(findings)} unexpected NTP {word}"
    tone = "urgent"
elif servers:
    shown = ", ".join(servers[:3])
    summary = f"Timezone is {tz}; NTP servers {shown}"
    tone = "info"
else:
    summary = f"Timezone is {tz}; no NTP servers configured"
    tone = "watch"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "findings": findings,
    "extra": {"timezone": tz, "ntpServers": servers},
    "report": {
        "tone": tone,
        "facts": [
            {"label": "Timezone", "value": tz},
            {"label": "NTP servers", "value": ", ".join(servers) if servers else "none"},
        ],
    },
}))
PY
