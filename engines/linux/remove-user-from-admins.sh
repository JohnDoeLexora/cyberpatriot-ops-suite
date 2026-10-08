#!/usr/bin/env bash
# Drop a user from sudo/wheel. Refuses the current user and an empty admin allowlist.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
user="${2:-${CP_USERNAME:-}}"
if [[ -z "$user" ]] || ! cp_safe_user "$user"; then
  cp_fail "username is required. Nothing was changed."
fi
cp_refuse_self "$user"
root="$(cp_repo_root)"
admins="${CP_ADMINS:-${root}/config/allowed-admins.txt}"
cp_load_allowlist "$admins" 1
if [[ "${CP_FORCE:-0}" != "1" ]]; then
  for allowed in "${CP_ALLOW_NAMES[@]}"; do
    if [[ "$allowed" == "$user" ]]; then
      cp_fail "Refusing to remove ${user} from administrators: they are in ${admins}. Edit the allowlist first, or pass force=true when the README says they should not be an admin."
    fi
  done
fi
if ! cp_user_exists "$user"; then
  cp_fail "User '${user}' does not exist. Nothing was changed."
fi
groups="$(id -nG "$user" 2>/dev/null || true)"
touched=0
for group in sudo wheel admin; do
  if ! printf '%s\n' "$groups" | tr ' ' '\n' | grep -qx "$group"; then
    continue
  fi
  touched=1
  cp_note_change "Will remove ${user} from group ${group}"
  if ! cp_is_dry; then
    cp_need_root
    gpasswd -d "$user" "$group" || cp_fail "Could not remove ${user} from ${group}. Try: sudo gpasswd -d ${user} ${group}"
  fi
done
if [[ "$touched" -eq 0 ]]; then
  cp_note_ok "User ${user} is not in sudo, wheel, or admin"
fi
cp_finish
