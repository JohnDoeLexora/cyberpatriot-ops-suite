#!/usr/bin/env bash
# Set PermitRootLogin no and validate sshd.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cfg="/etc/ssh/sshd_config"
if [[ -f "$(cp_resolve "$cfg")" ]]; then
  cp_ensure_kv "$cfg" PermitRootLogin no space
fi
cp_install_file /etc/ssh/sshd_config.d/99-cp-noroot.conf <<'EOF'
PermitRootLogin no
EOF
cp_validate_sshd
if ! cp_is_dry && [[ -z "${CP_ROOT:-}" ]] && command -v systemctl >/dev/null 2>&1; then
  systemctl reload ssh >/dev/null 2>&1 || systemctl reload sshd >/dev/null 2>&1 || cp_warn "PermitRootLogin was written but ssh was not reloaded."
fi
cp_finish
