#!/usr/bin/env bash
# Enforce common AppArmor profiles when aa-enforce exists.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_need_cmd aa-enforce "Install it with: sudo apt-get install apparmor-utils"
for profile in apache2 httpd mysqld ntpd named dhcpd ping tcpdump; do
  cp_note_change "Will enforce AppArmor profile ${profile}"
  if ! cp_is_dry; then
    cp_need_root
    if ! aa-enforce "$profile" >/dev/null 2>&1; then
      cp_warn "Profile ${profile} was not enforced. It may not be installed on this image."
    fi
  fi
done
cp_finish
