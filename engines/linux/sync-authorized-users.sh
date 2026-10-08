#!/usr/bin/env bash
# Create missing README users without a password. Never disables extras.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
repo="$(cp_repo_root)"
allow="${CP_ALLOWLIST:-${repo}/config/allowed-users.txt}"
admins_file="${CP_ADMINS:-${repo}/config/allowed-admins.txt}"
cp_load_allowlist "$allow" 1
users=("${CP_ALLOW_NAMES[@]}")
admin_names=()
if [[ -f "$admins_file" ]]; then
  cp_load_allowlist "$admins_file" 0
  if [[ ${#CP_ALLOW_NAMES[@]} -gt 0 ]]; then
    admin_names=("${CP_ALLOW_NAMES[@]}")
  fi
fi
for name in "${users[@]}"; do
  if cp_user_exists "$name"; then
    cp_note_ok "Account ${name} already exists"
    continue
  fi
  cp_note_change "Will create ${name} with no password (useradd -m). Set one yourself: passwd ${name}"
  if ! cp_is_dry; then
    cp_need_root
    useradd -m -s /bin/bash "$name" || cp_fail "useradd failed for ${name}. The account was not given a password."
  fi
done
for name in "${admin_names[@]+"${admin_names[@]}"}"; do
  [[ -z "$name" || "$name" == "root" ]] && continue
  if ! cp_user_exists "$name" && cp_is_dry; then
    cp_detail "Would add ${name} to sudo after the account exists"
    continue
  fi
  if ! cp_user_exists "$name"; then
    cp_warn "Admin ${name} still does not exist, so they were not added to sudo."
    continue
  fi
  groups="$(id -nG "$name" 2>/dev/null || true)"
  if printf '%s\n' "$groups" | tr ' ' '\n' | grep -qx sudo || printf '%s\n' "$groups" | tr ' ' '\n' | grep -qx wheel; then
    cp_note_ok "${name} is already in sudo or wheel"
    continue
  fi
  cp_note_change "Will add ${name} to sudo (or wheel)"
  if ! cp_is_dry; then
    cp_need_root
    usermod -aG sudo "$name" 2>/dev/null || usermod -aG wheel "$name" || cp_warn "Could not add ${name} to sudo or wheel."
  fi
done
cp_detail "Extra accounts are reported by select-unauthorized-users. This op does not disable them and never invents a password."
cp_finish
