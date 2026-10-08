# Blacklist uncommon kernel modules

- **Catalog id:** `blacklist-kernel-modules`
- **Category:** kernel
- **Platforms:** linux
- **Risk:** mutate

> Blacklist uncommon protocols/filesystems; usb-storage only if you opt in.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Writes /etc/modprobe.d/cp-blacklist.conf for dccp/sctp/cramfs/hfs/firewire and the list in config/kernel-module-blacklist.txt. usb-storage is included only when usbStorage=true (default false) so keyboards stay.

## Why it scores in CyberPatriot

Unused network filesystems and obscure protocols are CIS/CP extras. usb-storage is a README call because some images need a USB stick.

## What it changes

Writes /etc/modprobe.d/cp-blacklist.conf blacklisting dccp, sctp, rds, tipc, cramfs, freevxfs, jffs2, hfs, hfsplus, udf, and firewire-core. usb-storage is added only when CP_USB_STORAGE=1.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Delete cp-blacklist.conf. Already-loaded modules stay until reboot. Leave usb-storage out unless you meant to disable USB disks.

## When to run it

Linux kernel pass with harden-sysctl, after you know whether removable storage is required.

## Step-by-step

1. Skim config/kernel-module-blacklist.txt. Leave usbStorage false unless the README forbids USB disks.
2. dryRun:true, then live confirm:true.
3. Reboot is not required for the file to exist; loaded modules stay until rmmod/reboot.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: /etc/modprobe.d/cp-blacklist.conf lists dccp/sctp/cramfs/hfs.

## What “good” looks like

- /etc/modprobe.d/cp-blacklist.conf lists dccp/sctp/cramfs/hfs.
- usb-storage still loadable unless you passed usbStorage:true.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Blacklisting usb-storage can block a README-required USB workflow. Default is off.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`harden-sysctl`](./harden-sysctl.md) — Apply sysctl hardening
- [`audit-sysctl`](./audit-sysctl.md) — Audit sysctl hardening
- [`harden-usb-storage`](./harden-usb-storage.md) — Harden USB autorun / storage policy
- [`audit-mac-enforcement`](./audit-mac-enforcement.md) — Audit AppArmor/SELinux enforcement

