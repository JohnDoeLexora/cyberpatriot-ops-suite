#!/usr/bin/env bash
# Turn off LightDM/GDM guest sessions and autologin.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_install_file /etc/lightdm/lightdm.conf.d/99-cp-hardening.conf <<'EOF'
[Seat:*]
allow-guest=false
greeter-allow-guest=false
autologin-guest=false
autologin-user=
EOF
gdm=""
if [[ -d "$(cp_resolve /etc/gdm3)" ]]; then
  gdm=/etc/gdm3/custom.conf
elif [[ -d "$(cp_resolve /etc/gdm)" ]]; then
  gdm=/etc/gdm/custom.conf
fi
if [[ -n "$gdm" ]]; then
  cp_ensure_kv "$gdm" AutomaticLoginEnable false assign
  cp_ensure_kv "$gdm" TimedLoginEnable false assign
fi
cp_finish
