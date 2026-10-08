#!/usr/bin/env bash
# Remove one package. Refuses required services unless force=true.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
pkg="${2:-${CP_PACKAGE:-}}"
if [[ -z "$pkg" || ! "$pkg" =~ ^[A-Za-z0-9.+_-]+$ ]]; then
  cp_fail "package is required (letters, digits, dot, plus, underscore, hyphen). Nothing was removed."
fi
case "$pkg" in
  openssh-server|apache2|sudo|bash|systemd|ssh)
    if [[ "${CP_FORCE:-0}" != "1" ]]; then
      cp_fail "Refusing to remove ${pkg}: it looks like a required service. Pass force=true only when the README says it is not scored."
    fi
    ;;
esac
if command -v dpkg-query >/dev/null 2>&1; then
  if ! dpkg-query -W -f='${Status}' "$pkg" 2>/dev/null | grep -q "install ok installed"; then
    cp_note_ok "Package ${pkg} is not installed"
    cp_finish
  fi
  cp_note_change "Will remove package ${pkg} (apt-get remove)"
  if ! cp_is_dry; then
    cp_need_root
    DEBIAN_FRONTEND=noninteractive apt-get remove -y "$pkg" || cp_fail "apt-get remove ${pkg} failed. Read the apt error and re-run."
  fi
  cp_finish
fi
if command -v dnf >/dev/null 2>&1; then
  cp_note_change "Will remove package ${pkg} (dnf remove)"
  if ! cp_is_dry; then
    cp_need_root
    dnf remove -y "$pkg" || cp_fail "dnf remove ${pkg} failed."
  fi
  cp_finish
fi
cp_skip "Skipped: neither apt-get nor dnf is installed, so the package was not removed."
