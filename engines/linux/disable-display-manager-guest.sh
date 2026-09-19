#!/usr/bin/env bash
# Disable LightDM/GDM guest sessions and autologin.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
mkdir -p /etc/lightdm/lightdm.conf.d
cat > /etc/lightdm/lightdm.conf.d/99-cp-hardening.conf <<'EOF'
[Seat:*]
allow-guest=false
greeter-allow-guest=false
autologin-guest=false
autologin-user=
EOF
gdm=""
if [[ -d /etc/gdm3 ]]; then gdm=/etc/gdm3/custom.conf
elif [[ -d /etc/gdm ]]; then gdm=/etc/gdm/custom.conf
fi
if [[ -n "$gdm" ]]; then
  mkdir -p "$(dirname "$gdm")"
  if [[ ! -f "$gdm" ]]; then
    printf '[daemon]\nAutomaticLoginEnable=false\nTimedLoginEnable=false\n' > "$gdm"
  else
    sed -i -E 's/^[[:space:]]*AutomaticLoginEnable[[:space:]]*=.*/AutomaticLoginEnable=false/I' "$gdm" || true
    grep -qi '^\[daemon\]' "$gdm" || printf '\n[daemon]\n' >> "$gdm"
    grep -qi 'AutomaticLoginEnable=' "$gdm" || sed -i 's/\[daemon\]/[daemon]\nAutomaticLoginEnable=false/I' "$gdm"
  fi
fi
echo '{"ok":true,"detail":"disabled display-manager guest and autologin"}'
