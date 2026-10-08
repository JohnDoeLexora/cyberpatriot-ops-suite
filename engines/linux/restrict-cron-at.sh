#!/usr/bin/env bash
# Limit cron and at to root. Backs up existing allow files.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_install_file /etc/cron.allow 600 <<'EOF'
root
EOF
cp_install_file /etc/at.allow 600 <<'EOF'
root
EOF
for deny in /etc/cron.deny /etc/at.deny; do
  resolved="$(cp_resolve "$deny")"
  if [[ -e "$resolved" ]]; then
    cp_note_change "Will remove ${deny}"
    if ! cp_is_dry; then
      cp_need_root
      cp_backup_file "$resolved"
      rm -f "$resolved"
    fi
  else
    cp_note_ok "${deny} is already absent"
  fi
done
cp_finish
