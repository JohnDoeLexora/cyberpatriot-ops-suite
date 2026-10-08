# Harden vsftpd (disable anonymous)

- **Catalog id:** `harden-vsftpd`
- **Category:** services
- **Platforms:** linux
- **Risk:** mutate

> Turn off anonymous FTP in vsftpd.conf; disable vsftpd if it is not required.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Sets anonymous_enable=NO, write_enable=NO, and anon_upload_enable=NO. If vsftpd is not in required-services.txt, also stop/disable the unit. Reloads vsftpd.

## Why it scores in CyberPatriot

This is the mutate that closes audit-anonymous-ftp. Anonymous write is a critical finding even when FTP stays.

## What it changes

Sets anonymous_enable, write_enable, anon_upload_enable, and anon_mkdir_write_enable to NO in /etc/vsftpd.conf or /etc/vsftpd/vsftpd.conf, reloads vsftpd, and disables the service unless config/required-services.txt lists vsftpd.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Restore the previous vsftpd.conf from the backup. If the service was disabled and the README needs FTP, systemctl enable --now vsftpd after anonymous login stays NO.

## When to run it

After audit-anonymous-ftp, once you know whether the README requires FTP.

## Step-by-step

1. Run audit-anonymous-ftp and check required-services.txt / the README.
2. dryRun:true to see the planned conf edits.
3. Live confirm:true. If FTP is required, anonymous still goes off and the service stays.
4. Re-run audit-anonymous-ftp and audit-listening-ports.

## What “good” looks like

- anonymous_enable=NO.
- vsftpd disabled when FTP is not required.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Disabling a README-required FTP service costs points — harden anonymous instead.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`audit-anonymous-ftp`](./audit-anonymous-ftp.md) — Audit anonymous FTP / vsftpd
- [`disable-service`](./disable-service.md) — Disable a service
- [`audit-ftp-telnet`](./audit-ftp-telnet.md) — Audit FTP and Telnet
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports

