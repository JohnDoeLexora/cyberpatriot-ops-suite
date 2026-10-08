# Harden USB autorun / storage policy

- **Catalog id:** `harden-usb-storage`
- **Category:** kernel
- **Platforms:** both
- **Risk:** mutate

> Disable USB autorun/execute. Mass-storage driver stays unless you opt in.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Windows: NoDriveTypeAutoRun and RemovableStorageDevices Deny_Execute. Linux: udev/udisks automount off. Optional disableUsbStorage=true blacklists usb-storage/USBSTOR — default false so keyboards/mice stay. Deepens disable-autoplay.

## Why it scores in CyberPatriot

Autorun from removable media is a persistence path and a checkbox Windows/Linux item. Killing the USB HID stack is usually wrong.

## What it changes

On Windows it sets NoDriveTypeAutoRun to 255 and Deny_Execute on removable disks. On Linux it writes /etc/udev/rules.d/99-cp-usb.rules and a dconf policy that turns automount off. The usb-storage driver is blacklisted only when CP_DISABLE_USB_STORAGE=1.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Delete the udev rule and dconf file on Linux, and remove NoDriveTypeAutoRun and the RemovableStorageDevices Deny_Execute value on Windows. Remove /etc/modprobe.d/usb-storage.conf if you also blacklisted the driver.

## When to run it

With disable-autoplay on Windows, or Linux kernel extras after blacklist-kernel-modules.

## Step-by-step

1. Leave disableUsbStorage false unless the README forbids USB disks.
2. dryRun:true, then live confirm:true.
3. Removable media should not auto-launch. Keyboard still works.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: Autorun/automount off. Deny_Execute on removable (Windows).

## What “good” looks like

- Autorun/automount off. Deny_Execute on removable (Windows).
- USBSTOR/usb-storage still loaded unless you opted in.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- disableUsbStorage=true can block a README-required USB stick and, on some images, more than disks. Default is off.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`disable-autoplay`](./disable-autoplay.md) — Disable Autoplay
- [`blacklist-kernel-modules`](./blacklist-kernel-modules.md) — Blacklist uncommon kernel modules
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender
- [`audit-startup-items`](./audit-startup-items.md) — Audit startup items

