# Audit Postfix/Exim/Dovecot relay

- **Catalog id:** `audit-mail-services`
- **Category:** services
- **Platforms:** linux
- **Risk:** read

> If postfix/exim/dovecot is installed, flag open relay and VRFY.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads inet_interfaces, mynetworks, disable_vrfy_command, and Dovecot plaintext auth. Local config only — does not send mail or probe other MX hosts.

## Why it scores in CyberPatriot

An open relay or unused MTA is a high Linux finding. Knowing which knob is wrong tells you whether to harden or disable the daemon.

## When to run it

Linux services pass with audit-web-server and audit-snmp, after flag-risky-services.

## Step-by-step

1. Run the op. If mail is absent, you are done.
2. Read the README: is mail a required service? If not, plan disable-service postfix/exim4.
3. If mail stays, set mynetworks to local-only and disable_vrfy_command=yes on the image (this op is read-only).

## What “good” looks like

- No mynetworks 0.0.0.0/0. VRFY disabled. Or the MTA is not installed.
- This op did not send a test message.

## Risks / confirm notes

- Read-only. Do not send mail to other hosts as a ‘test’.
- Authorized-image only.

## Related ops

- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`disable-service`](./disable-service.md) — Disable a service
- [`audit-web-server`](./audit-web-server.md) — Apache/nginx hardening checklist
- [`audit-snmp`](./audit-snmp.md) — Audit SNMP community / insecure mgmt

