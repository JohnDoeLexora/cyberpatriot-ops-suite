#!/usr/bin/env bash
# Disable USB automount. Optional CP_DISABLE_USB_STORAGE=1 blacklists usb-storage.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
mkdir -p /etc/udev/rules.d /etc/dconf/db/local.d
cat > /etc/udev/rules.d/99-cp-usb.rules <<'EOF'
ACTION=="add", SUBSYSTEM=="block", ENV{ID_USB_DRIVER}=="usb-storage", ENV{UDISKS_AUTO}="0"
EOF
cat > /etc/dconf/db/local.d/00-cp-usb <<'EOF'
[org/gnome/desktop/media-handling]
automount=false
automount-open=false
EOF
if [[ "${CP_DISABLE_USB_STORAGE:-0}" == "1" ]]; then
  mkdir -p /etc/modprobe.d
  echo -e "blacklist usb-storage\ninstall usb-storage /bin/true" > /etc/modprobe.d/usb-storage.conf
fi
echo '{"ok":true,"detail":"USB automount policy written"}'
