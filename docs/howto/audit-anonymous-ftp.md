# Audit anonymous FTP / vsftpd

- **Catalog id:** `audit-anonymous-ftp`
- **Category:** services
- **Platforms:** both
- **Risk:** read

> Parse vsftpd/proftpd for anonymous_enable and anon upload — deeper than port 21.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads vsftpd.conf / proftpd / FTPSVC knobs: anonymous_enable, anon_upload, write_enable, chroot. Does not log in anonymously and does not scan other hosts.

## Why it scores in CyberPatriot

Anonymous FTP is almost never required and almost always scored. Knowing *which knob* is on tells you whether to harden or disable the daemon.

## When to run it

With audit-ftp-telnet and flag-risky-services, before harden-vsftpd.

## Step-by-step

1. Run the op. Note anonymous_enable, write_enable, and anon_upload_enable.
2. Read the README: is FTP a scored service? If not, plan to disable vsftpd after hardening anonymous off.
3. If FTP is required, harden-vsftpd (anonymous off) rather than killing the daemon.
4. Re-run plus audit-listening-ports (21).

## What “good” looks like

- anonymous_enable=NO and no anon upload.
- vsftpd disabled entirely when the README does not need FTP.

## Risks / confirm notes

- Read-only. This is not an anonymous login test against anyone.
- If the README requires FTP, do not disable the service — turn anonymous off.

## Related ops

- [`harden-vsftpd`](./harden-vsftpd.md) — Harden vsftpd (disable anonymous)
- [`audit-ftp-telnet`](./audit-ftp-telnet.md) — Audit FTP and Telnet
- [`disable-service`](./disable-service.md) — Disable a service
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services

