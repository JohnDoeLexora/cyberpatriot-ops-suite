#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, pathlib
files = []
findings = []
paths = [pathlib.Path("/etc/crontab")]
cron_d = pathlib.Path("/etc/cron.d")
if cron_d.is_dir():
    paths.extend(sorted(cron_d.glob("*")))
for p in paths:
    if not p.is_file():
        continue
    try:
        text = p.read_text(errors="replace")
    except OSError:
        text = ""
    note = "cron file"
    if "wget" in text.lower() or "curl" in text.lower():
        note = "mentions wget or curl"
        findings.append({"id": f"cron:{p}", "severity": "high", "title": f"Cron file mentions a downloader: {p}", "detail": "The command text is not dumped.", "resource": str(p)})
    files.append({"path": str(p), "kind": "file", "note": note})
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": f"{len(files)} cron files.",
    "files": files,
    "findings": findings,
}, indent=2))
PY
