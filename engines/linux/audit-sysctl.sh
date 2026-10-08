#!/usr/bin/env bash
# Read-only sysctl snapshot. Does not write sysctl settings.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v sysctl >/dev/null 2>&1; then
  cp_skip "Skipped: sysctl is not installed, so kernel network settings were not read."
fi
python3 - <<'PY'
import json, subprocess
keys = [
    "net.ipv4.ip_forward",
    "net.ipv4.tcp_syncookies",
    "net.ipv4.conf.all.accept_redirects",
    "net.ipv4.conf.all.rp_filter",
    "kernel.randomize_va_space",
    "kernel.dmesg_restrict",
]
labels = {
    "net.ipv4.ip_forward": "Forwarding",
    "net.ipv4.tcp_syncookies": "Syncookies",
    "net.ipv4.conf.all.accept_redirects": "Accept redirects",
    "net.ipv4.conf.all.rp_filter": "Reverse path filter",
    "kernel.randomize_va_space": "ASLR",
    "kernel.dmesg_restrict": "dmesg restrict",
}
values = {}
errors = []
for key in keys:
    try:
        values[key] = subprocess.check_output(["sysctl", "-n", key], text=True, stderr=subprocess.STDOUT, timeout=5).strip()
    except Exception as exc:
        values[key] = "unreadable"
        errors.append(f"{key}: {exc}")
fwd = values["net.ipv4.ip_forward"]
sync = values["net.ipv4.tcp_syncookies"]
parts = []
if fwd == "0":
    parts.append("forwarding off")
elif fwd == "1":
    parts.append("forwarding on")
if sync == "1":
    parts.append("syncookies on")
elif sync == "0":
    parts.append("syncookies off")
summary = "Sysctl: " + ", ".join(parts) if parts else "Sysctl snapshot is unreadable"
tone = "urgent" if fwd == "1" or sync == "0" else "watch" if errors else "clear"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "extra": {"sysctl": values},
    "report": {
        "tone": tone,
        "facts": [{"label": labels[key], "value": values[key]} for key in keys],
    },
}, indent=2))
PY
