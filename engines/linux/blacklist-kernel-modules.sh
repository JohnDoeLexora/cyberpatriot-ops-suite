#!/usr/bin/env bash
# Blacklist uncommon kernel modules. usb-storage only when asked.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
mods=(dccp sctp rds tipc cramfs freevxfs jffs2 hfs hfsplus udf firewire-core)
body=""
for mod in "${mods[@]}"; do
  body+="blacklist ${mod}"$'\n'"install ${mod} /bin/true"$'\n'
done
if [[ "${CP_USB_STORAGE:-0}" == "1" ]]; then
  body+="blacklist usb-storage"$'\n'"install usb-storage /bin/true"$'\n'
  cp_detail "usb-storage is included because CP_USB_STORAGE=1."
fi
cp_install_file /etc/modprobe.d/cp-blacklist.conf <<EOF
${body}
EOF
cp_finish
