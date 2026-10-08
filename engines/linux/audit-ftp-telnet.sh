#!/usr/bin/env bash
# Inventory FTP and telnet units and listeners.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, shutil, subprocess
services, ports = [], []
warnings = []
if shutil.which("systemctl"):
    try:
        out = subprocess.check_output(["systemctl", "list-units", "--type=service", "--all", "--no-pager", "--no-legend", "--plain"], text=True, stderr=subprocess.DEVNULL)
        for line in out.splitlines():
            cols = line.split()
            if not cols:
                continue
            name = cols[0]
            if any(x in name.lower() for x in ("telnet", "ftp", "vsftpd", "proftpd")):
                services.append({"name": name, "state": "running" if len(cols) > 2 and cols[2] == "active" else "stopped", "enabled": False, "platform": "linux"})
    except Exception as exc:
        warnings.append(str(exc))
else:
    warnings.append("systemctl is not installed")
if shutil.which("ss"):
    try:
        out = subprocess.check_output(["ss", "-lntu"], text=True, stderr=subprocess.DEVNULL)
        for line in out.splitlines():
            if ":21 " in line or ":23 " in line or line.rstrip().endswith(":21") or line.rstrip().endswith(":23"):
                ports.append({"protocol": "tcp", "port": 23 if ":23" in line else 21, "address": "0.0.0.0"})
    except Exception as exc:
        warnings.append(str(exc))
summary = f"FTP/Telnet services={len(services)} listeners={len(ports)}."
print(json.dumps({"ok": True, "status": "ok", "summary": summary, "services": services, "ports": ports, "warnings": warnings}, indent=2))
PY
