#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LIST="${CP_PROHIBITED:-$ROOT/config/prohibited-software.txt}"
python3 - "$LIST" <<'PY'
import json, subprocess, sys
names = set()
try:
    for line in open(sys.argv[1]):
        line = line.strip()
        if line and not line.startswith("#"):
            names.add(line.lower())
except FileNotFoundError:
    names = {"nmap", "hydra", "john", "netcat-traditional", "ophcrack"}
try:
    out = subprocess.check_output(["dpkg-query", "-W", "-f=${Package}\t${Version}\n"], text=True)
except Exception:
    out = ""
packages = []
for line in out.splitlines():
    name, _, version = line.partition("\t")
    if name.lower() in names:
        packages.append({"name": name, "version": version, "prohibited": True})
print(json.dumps({"ok": True, "packages": packages}, indent=2))
PY
