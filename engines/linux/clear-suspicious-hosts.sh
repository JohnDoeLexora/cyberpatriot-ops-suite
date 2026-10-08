#!/usr/bin/env bash
# Drop hosts-file sinkholes of update and vendor names. Keep localhost.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
dest="$(cp_resolve /etc/hosts)"
outcome="$(python3 - "$dest" <<'PY'
import json, pathlib, re, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text(encoding="utf-8", errors="replace") if path.is_file() else "127.0.0.1\tlocalhost\n"
pat = re.compile(r"windowsupdate|microsoft\.com|virustotal|avast|avg|defender|google\.com|facebook|youtube|twitter|bing\.com|adobe\.com|symantec|mcafee", re.I)
keep, dropped = [], []
for line in text.splitlines(True):
    raw = line.strip()
    if not raw or raw.startswith("#"):
        keep.append(line if line.endswith("\n") else line + "\n")
        continue
    parts = raw.split()
    ip, names = parts[0], parts[1:]
    sink = ip in {"127.0.0.1", "0.0.0.0", "::1"}
    if sink and any(pat.search(n or "") for n in names):
        dropped.append(raw)
        continue
    keep.append(line if line.endswith("\n") else line + "\n")
new = "".join(keep) if keep else "127.0.0.1\tlocalhost\n"
print(json.dumps({"same": new == text, "dropped": dropped, "text": new}))
PY
)"
same="$(python3 -c 'import json,sys; print("1" if json.loads(sys.argv[1])["same"] else "0")' "$outcome")"
count="$(python3 -c 'import json,sys; print(len(json.loads(sys.argv[1])["dropped"]))' "$outcome")"
if [[ "$same" == "1" || "$count" == "0" ]]; then
  cp_note_ok "No suspicious sinkhole lines in /etc/hosts"
  cp_finish
fi
cp_note_change "Will remove ${count} suspicious sinkhole line(s) from /etc/hosts"
if ! cp_is_dry; then
  cp_need_root
  cp_backup_file "$dest"
  python3 -c 'import json,sys,pathlib; pathlib.Path(sys.argv[1]).write_text(json.loads(sys.argv[2])["text"], encoding="utf-8")' "$dest" "$outcome"
fi
cp_finish
