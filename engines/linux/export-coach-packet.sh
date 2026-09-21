#!/usr/bin/env bash
# Redacted coach packet. No hashes, no keys, no CCS.
set -euo pipefail
OUT="${CP_OUTPUT_DIR:-/tmp/cp-ops-coach-packet}"
mkdir -p "$OUT"
python3 - "$OUT" <<'PY'
import json, os, sys, zipfile
out = sys.argv[1]
files = {
    "SUMMARY.md": "# Coach packet\n\nRedacted authorized-image handoff. No hashes, no private keys, no Wi-Fi PSKs, no CCS URLs.\n",
    "NOTES.md": "Coach packet. Competition-legal. CCS not contacted.\n",
    "findings.json": "[]\n",
    "users.json": "[]\n",
    "services.json": "[]\n",
    "ports.json": "[]\n",
}
for name, body in files.items():
    open(os.path.join(out, name), "w").write(body)
zpath = os.path.join(out, "coach-packet.zip")
with zipfile.ZipFile(zpath, "w") as zf:
    for name in files:
        zf.write(os.path.join(out, name), name)
print(json.dumps({"ok": True, "extra": {"written": zpath, "redacted": True, "ccsContacted": False, "hashesIncluded": False}}))
PY
