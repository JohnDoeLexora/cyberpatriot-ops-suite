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

## When to run it

With disable-autoplay on Windows, or Linux kernel extras after blacklist-kernel-modules.

## Step-by-step

1. Leave disableUsbStorage false unless the README forbids USB disks.
2. dryRun:true, then live confirm:true.
3. Removable media should not auto-launch. Keyboard still works.

## What “good” looks like

- Autorun/automount off. Deny_Execute on removable (Windows).
- USBSTOR/usb-storage still loaded unless you opted in.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- disableUsbStorage=true can block a README-required USB stick and, on some images, more than disks. Default is off.

## Related ops

- [`disable-autoplay`](./disable-autoplay.md) — Disable Autoplay
- [`blacklist-kernel-modules`](./blacklist-kernel-modules.md) — Blacklist uncommon kernel modules
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender
- [`audit-startup-items`](./audit-startup-items.md) — Audit startup items

