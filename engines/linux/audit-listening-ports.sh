#!/usr/bin/env bash
# Local listeners only — never scans other hosts.
# The structured port list is what the dashboard table renders. Bend still scores file walks.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, re, shutil, subprocess
cmd = ["ss", "-lntupH"] if shutil.which("ss") else ["netstat", "-lntup"]
try:
    out = subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL)
except Exception as exc:
    print(json.dumps({
        "ok": False,
        "status": "skipped",
        "summary": f"Skipped: could not list listeners ({exc}). Install iproute2 (ss) and re-run.",
        "exitCode": 3,
    }))
    raise SystemExit(3)
suspicious = {23, 21, 69, 111, 135, 139, 445, 512, 513, 514, 1433, 3306, 3389, 5900, 4444, 31337}
ports = []
seen = set()
for line in out.splitlines():
    proto = "udp" if line.lower().startswith("udp") else "tcp" if line.lower().startswith("tcp") else None
    if not proto:
        continue
    match = re.search(r"(\d{1,3}(?:\.\d{1,3}){3}|\*|\[?[0-9a-fA-F:]+\]):(\d+)", line)
    if not match:
        continue
    addr, port = match.group(1), int(match.group(2))
    key = (proto, addr, port)
    if key in seen:
        continue
    seen.add(key)
    proc = None
    proc_match = re.search(r'users:\(\("([^"]+)', line) or re.search(r"(\S+)/(\d+)\s*$", line)
    if proc_match:
        proc = proc_match.group(1)
    row = {"protocol": proto, "port": port, "address": "*" if addr == "*" else addr, "process": proc}
    if port in suspicious:
        row["suspicious"] = True
        row["reason"] = "unexpected"
    ports.append(row)
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": f"{len(ports)} listeners.",
    "ports": ports,
}, indent=2))
PY
