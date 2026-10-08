#!/usr/bin/env bash
# Disable USB automount. Mass-storage blacklist only when asked.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_install_file /etc/udev/rules.d/99-cp-usb.rules <<'EOF'
ACTION=="add", SUBSYSTEM=="block", ENV{ID_USB_DRIVER}=="usb-storage", ENV{UDISKS_AUTO}="0"
EOF
cp_install_file /etc/dconf/db/local.d/00-cp-usb <<'EOF'
[org/gnome/desktop/media-handling]
automount=false
automount-open=false
EOF
if [[ "${CP_DISABLE_USB_STORAGE:-0}" == "1" ]]; then
  cp_install_file /etc/modprobe.d/usb-storage.conf <<'EOF'
blacklist usb-storage
install usb-storage /bin/true
EOF
else
  cp_detail "usb-storage was not blacklisted (CP_DISABLE_USB_STORAGE is not 1)."
fi
cp_finish
