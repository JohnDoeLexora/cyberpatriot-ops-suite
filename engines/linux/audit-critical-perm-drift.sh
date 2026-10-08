#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
HERE="$(cd "$(dirname "$0")" && pwd)"
# Bend scores every shadow path. Count only the world-writable tag so a normal
# shadow file is not reported as drift. The fallback lists modes itself.
if [[ -z "${CP_SKIP_BEND:-}" && -z "${CP_SCAN_ROOT:-}" && -x "$HERE/../bend/run.sh" ]]; then
  if "$HERE/../bend/run.sh" files-perms | cp_annotate_scan \
    "No world-writable critical files among passwd, shadow, group, sudoers, ssh, and crontab" \
    "world-writable critical files" \
    "/etc/passwd, /etc/shadow, /etc/group, /etc/sudoers, /etc/ssh, /etc/crontab" \
    "world-writable"; then
    exit 0
  fi
fi
"$HERE/check-sensitive-file-perms.sh"
