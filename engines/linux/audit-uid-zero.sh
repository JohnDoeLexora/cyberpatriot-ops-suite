#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json, pwd
users = [{"name": p.pw_name, "uid": p.pw_uid, "home": p.pw_dir, "shell": p.pw_shell, "passwordHidden": True, "platform": "linux", "groups": []} for p in pwd.getpwall() if p.pw_uid == 0]
print(json.dumps({"ok": True, "users": users}, indent=2))
PY
