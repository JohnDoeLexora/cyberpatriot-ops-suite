#!/usr/bin/env bash
# Write the sysctl drop-in and apply it when not in a fixture.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_install_file /etc/sysctl.d/99-cp-hardening.conf <<'EOF'
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.tcp_syncookies = 1
net.ipv6.conf.all.accept_redirects = 0
kernel.randomize_va_space = 2
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
EOF
if ! cp_is_dry && [[ -z "${CP_ROOT:-}" ]]; then
  if command -v sysctl >/dev/null 2>&1; then
    sysctl --system >/dev/null 2>&1 || cp_warn "sysctl --system reported an error. The drop-in is in place; run sudo sysctl --system to see which line failed."
  else
    cp_warn "sysctl is not installed, so the drop-in was not applied to the running kernel."
  fi
fi
cp_finish
