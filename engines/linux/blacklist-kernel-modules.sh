#!/usr/bin/env bash
# Blacklist uncommon kernel modules. usb-storage only with CP_USB_STORAGE=1.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
USB="${CP_USB_STORAGE:-0}"
python3 - "$USB" <<'PY'
import os, sys
usb = sys.argv[1] == "1"
mods = ["dccp","sctp","rds","tipc","cramfs","freevxfs","jffs2","hfs","hfsplus","udf","firewire-core"]
if usb:
    mods.append("usb-storage")
body = "".join(f"blacklist {m}\ninstall {m} /bin/true\n" for m in mods)
os.makedirs("/etc/modprobe.d", exist_ok=True)
open("/etc/modprobe.d/cp-blacklist.conf","w").write(body)
print('{"ok":true,"detail":"wrote /etc/modprobe.d/cp-blacklist.conf","usbStorage":%s}' % ("true" if usb else "false"))
PY
