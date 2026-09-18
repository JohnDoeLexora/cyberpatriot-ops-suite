#!/usr/bin/env bash
# Local listeners only — never scans other hosts.
set -euo pipefail
python3 - <<'PY'
import json, re, shutil, subprocess
cmd = ["ss", "-lntup"] if shutil.which("ss") else ["netstat", "-lntup"]
try:
    out = subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT)
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)}))
    raise SystemExit(0)
ports = []
seen = set()
for line in out.splitlines():
    proto = "udp" if line.lower().startswith("udp") else "tcp" if line.lower().startswith("tcp") else None
    if not proto:
        continue
    m = re.search(r"(\d{1,3}(?:\.\d{1,3}){3}|\*|\[?[0-9a-fA-F:]+\])[:](\d+)", line)
    if not m:
        continue
    addr, port = m.group(1), int(m.group(2))
    key = (proto, addr, port)
    if key in seen:
        continue
    seen.add(key)
    proc = None
    pm = re.search(r'users:\(\("([^"]+)', line) or re.search(r"(\w+)/\d+\s*$", line)
    if pm:
        proc = pm.group(1)
    ports.append({"protocol": proto, "port": port, "address": "*" if addr == "*" else addr, "process": proc})
print(json.dumps({"ok": True, "ports": ports}, indent=2))
PY
