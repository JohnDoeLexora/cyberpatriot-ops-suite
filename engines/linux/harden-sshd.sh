#!/usr/bin/env bash
# Write an sshd drop-in and align sshd_config. Validates with sshd -t.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cfg="/etc/ssh/sshd_config"
if [[ -f "$(cp_resolve "$cfg")" ]]; then
  cp_ensure_kv "$cfg" PermitRootLogin no space
  cp_ensure_kv "$cfg" PermitEmptyPasswords no space
  cp_ensure_kv "$cfg" X11Forwarding no space
  cp_ensure_kv "$cfg" MaxAuthTries 4 space
  cp_ensure_kv "$cfg" LoginGraceTime 30 space
  cp_ensure_kv "$cfg" ClientAliveInterval 300 space
  cp_ensure_kv "$cfg" ClientAliveCountMax 2 space
else
  cp_warn "${cfg} is missing; only the drop-in will be written."
fi
cp_install_file /etc/ssh/sshd_config.d/99-cp-hardening.conf <<'EOF'
# CyberPatriot authorized-image hardening (see docs/SAFETY.md)
PermitRootLogin no
PermitEmptyPasswords no
X11Forwarding no
MaxAuthTries 4
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
cp_validate_sshd
if ! cp_is_dry && [[ -z "${CP_ROOT:-}" ]] && command -v systemctl >/dev/null 2>&1; then
  systemctl reload ssh >/dev/null 2>&1 || systemctl reload sshd >/dev/null 2>&1 || cp_warn "sshd config was written but the service was not reloaded. Try: sudo systemctl reload ssh"
fi
cp_finish
