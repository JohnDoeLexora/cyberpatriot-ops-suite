#!/usr/bin/env bash
# Set login.defs aging and a pwquality drop-in. Does not change existing hashes.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
defs="$(cp_resolve /etc/login.defs)"
if [[ ! -e "$defs" && -z "${CP_ROOT:-}" ]]; then
  cp_warn "/etc/login.defs is missing; the keys will be created."
fi
cp_ensure_kv /etc/login.defs PASS_MAX_DAYS 90 defs
cp_ensure_kv /etc/login.defs PASS_MIN_DAYS 1 defs
cp_ensure_kv /etc/login.defs PASS_MIN_LEN 14 defs
cp_ensure_kv /etc/login.defs PASS_WARN_AGE 7 defs
cp_install_file /etc/security/pwquality.conf.d/99-cp.conf <<'EOF'
minlen = 14
dcredit = -1
ucredit = -1
lcredit = -1
ocredit = -1
minclass = 3
remember = 5
EOF
cp_finish
