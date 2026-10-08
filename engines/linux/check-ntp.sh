#!/usr/bin/env bash
# Report time sync. Skips clearly when timedatectl is missing.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
if ! command -v timedatectl >/dev/null 2>&1; then
  cp_skip "Skipped: timedatectl is not installed. On Debian/Ubuntu it is in the systemd package."
fi
timed="$(timedatectl status 2>&1 || true)"
chron=""
if command -v chronyc >/dev/null 2>&1; then
  chron="$(chronyc tracking 2>&1 || true)"
fi
python3 - "$timed" "$chron" <<'PY'
import json, shutil, subprocess, sys, re
timed, chron = sys.argv[1], sys.argv[2]

def field(name):
    match = re.search(rf"(?im)^{re.escape(name)}:\s*(.+)$", timed)
    return match.group(1).strip() if match else ""

def active(unit):
    if not shutil.which("systemctl"):
        return ""
    try:
        proc = subprocess.run(["systemctl", "is-active", unit], capture_output=True, text=True, timeout=5, check=False)
    except (OSError, subprocess.TimeoutExpired):
        return ""
    return (proc.stdout or "").strip()

synced = field("System clock synchronized").lower()
ntp_service = field("NTP service")
zone = field("Time zone") or "unknown"
backend = "unknown"
for unit, label in (
    ("systemd-timesyncd", "systemd-timesyncd"),
    ("chrony", "chrony"),
    ("chronyd", "chrony"),
    ("ntp", "ntpd"),
    ("ntpd", "ntpd"),
):
    if active(unit) == "active":
        backend = label
        break
if backend == "unknown" and "System time" in chron and "Leap status" in chron:
    backend = "chrony"
if synced == "yes":
    summary = f"NTP synced via {backend}" if backend != "unknown" else "NTP is synced"
    tone = "clear"
else:
    summary = "NTP is not synced"
    tone = "watch"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "extra": {"timedatectl": timed[:2000], "chrony": chron[:1000]},
    "report": {
        "tone": tone,
        "facts": [
            {"label": "Synchronized", "value": synced or "unknown"},
            {"label": "NTP service", "value": ntp_service or "unknown"},
            {"label": "Backend", "value": backend},
            {"label": "Time zone", "value": zone},
        ],
    },
}, indent=2))
PY
