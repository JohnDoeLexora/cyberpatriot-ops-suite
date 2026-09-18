# Shared helpers for CyberPatriot defensive shell ops.
# Source from other scripts: . "$(dirname "$0")/_lib.sh"

set -euo pipefail

cp_require_confirm() {
  if [[ "${CP_CONFIRM:-}" == "1" || "${1:-}" == "--confirm" ]]; then
    return 0
  fi
  echo '{"ok":false,"error":"mutation refused without --confirm (or CP_CONFIRM=1). See docs/SAFETY.md."}' >&2
  exit 2
}

cp_json_users() {
  python3 - <<'PY'
import json, os, pwd, grp, spwd
users = []
shadow = {}
try:
    for s in spwd.getspall():
        field = s.sp_pwd or ""
        shadow[s.sp_nam] = {
            "passwordEmpty": field == "",
            "passwordSet": bool(field) and not field.startswith("!") and not field.startswith("*"),
            "locked": field.startswith("!") or field.startswith("*"),
        }
except Exception:
    pass
for p in pwd.getpwall():
    groups = []
    try:
        groups = [g.gr_name for g in grp.getgrall() if p.pw_name in g.gr_mem]
    except Exception:
        groups = []
    flags = shadow.get(p.pw_name, {})
    users.append({
        "name": p.pw_name,
        "uid": p.pw_uid,
        "gid": p.pw_gid,
        "home": p.pw_dir,
        "shell": p.pw_shell,
        "groups": groups,
        "passwordHidden": True,
        "passwordEmpty": flags.get("passwordEmpty"),
        "passwordSet": flags.get("passwordSet"),
        "locked": flags.get("locked"),
        "platform": "linux",
    })
print(json.dumps({"ok": True, "users": users}, indent=2))
PY
}
