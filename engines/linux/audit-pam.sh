#!/usr/bin/env bash
# Look for nullok and missing faillock. Does not dump secrets.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json, os
root = os.environ.get("CP_ROOT", "")
base = (root + "/etc/pam.d") if root else "/etc/pam.d"
names = ["common-auth", "system-auth", "sshd"]
files, blob = [], ""
for name in names:
    path = os.path.join(base, name)
    if os.path.isfile(path):
        files.append(path)
        blob += open(path, encoding="utf-8", errors="replace").read() + "\n"
if not files:
    print(json.dumps({"ok": False, "status": "skipped", "summary": f"Skipped: no PAM files under {base}.", "exitCode": 3}))
    raise SystemExit(0)
findings = []
if "nullok" in blob:
    findings.append({"id": "nullok", "severity": "high", "title": "PAM nullok present", "detail": "Empty passwords may authenticate."})
if "pam_faillock" not in blob and "pam_tally2" not in blob:
    findings.append({"id": "faillock", "severity": "medium", "title": "No faillock/tally2", "detail": "Enable lockout.", "remediationOpId": "enable-account-lockout"})
nullok = any(item["id"] == "nullok" for item in findings)
faillock = any(item["id"] == "faillock" for item in findings)
files_word = "file" if len(files) == 1 else "files"
if nullok:
    summary = f"PAM allows empty passwords in {len(files)} {files_word}"
    tone = "urgent"
elif faillock:
    summary = f"PAM has no faillock in {len(files)} {files_word}"
    tone = "watch"
else:
    summary = f"PAM looks locked down in {len(files)} {files_word}"
    tone = "clear"
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "extra": {"files": files},
    "findings": findings,
    "report": {
        "tone": tone,
        "facts": [
            {"label": "Files", "value": ", ".join(files)},
            {"label": "nullok", "value": "present" if nullok else "absent"},
            {"label": "faillock", "value": "missing" if faillock else "present"},
        ],
    },
}, indent=2))
PY
