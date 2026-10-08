#!/usr/bin/env bash
# Remove installed games and sample packages from the allowlist file.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
repo="$(cp_repo_root)"
list="${CP_GAMES_LIST:-${repo}/config/games-samples.txt}"
cp_load_allowlist "$list" 1
if ! command -v dpkg-query >/dev/null 2>&1 && ! command -v rpm >/dev/null 2>&1; then
  cp_skip "Skipped: neither dpkg-query nor rpm is installed, so packages were not checked."
fi
targets=()
for name in "${CP_ALLOW_NAMES[@]}"; do
  case "$name" in
    openssh-server|apache2|sudo|bash|systemd|ssh) cp_warn "Skipped required-looking package ${name}"; continue ;;
  esac
  installed=0
  if command -v dpkg-query >/dev/null 2>&1; then
    if dpkg-query -W -f='${Status}' "$name" 2>/dev/null | grep -q "install ok installed"; then
      installed=1
    fi
  fi
  if [[ "$installed" -eq 1 ]]; then
    targets+=("$name")
    cp_note_change "Will remove package ${name}"
  fi
done
if [[ ${#targets[@]} -eq 0 ]]; then
  cp_note_ok "No games or sample packages from the list are installed"
  cp_finish
fi
if ! cp_is_dry; then
  cp_need_root
  if command -v apt-get >/dev/null 2>&1; then
    DEBIAN_FRONTEND=noninteractive apt-get remove -y "${targets[@]}" || cp_fail "apt-get remove failed for the games list."
  else
    cp_fail "apt-get is not available to remove the listed packages."
  fi
fi
cp_finish
