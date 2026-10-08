#!/usr/bin/env bash
# Enable periodic unattended upgrades. Distro package only.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_install_file /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
if ! dpkg-query -W -f='${Status}' unattended-upgrades 2>/dev/null | grep -q "install ok installed"; then
  if command -v apt-get >/dev/null 2>&1; then
    cp_note_change "Will install distro package unattended-upgrades"
    if ! cp_is_dry; then
      cp_need_root
      DEBIAN_FRONTEND=noninteractive apt-get install -y unattended-upgrades || cp_warn "Could not install unattended-upgrades. The apt periodic file was still written."
    fi
  else
    cp_warn "apt-get is not available, so unattended-upgrades was not installed."
  fi
else
  cp_note_ok "Package unattended-upgrades is already installed"
fi
if command -v systemctl >/dev/null 2>&1; then
  enabled="$(systemctl is-enabled unattended-upgrades 2>/dev/null || true)"
  if [[ "$enabled" == "enabled" || "$enabled" == "static" ]]; then
    cp_note_ok "unattended-upgrades is already enabled"
  elif [[ -n "$enabled" && "$enabled" != "not-found" ]]; then
    cp_note_change "Will enable unattended-upgrades"
    if ! cp_is_dry; then
      cp_need_root
      systemctl enable --now unattended-upgrades || cp_warn "Could not enable unattended-upgrades. The apt config is in place."
    fi
  fi
fi
cp_finish
