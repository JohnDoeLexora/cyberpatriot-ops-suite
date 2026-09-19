# Audit SNMP community / insecure mgmt

- **Catalog id:** `audit-snmp`
- **Category:** services
- **Platforms:** both
- **Risk:** read

> Detect SNMP and default public/private communities — no walks of other hosts.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Finds snmpd/SNMP and default community names (public/private), plus rwcommunity. Reports names only. Never uses them to query other devices.

## Why it scores in CyberPatriot

SNMP with community public is a classic insecure-mgmt finding. UDP/161 open plus public/private is an easy chunk of points.

## When to run it

Services pass with flag-risky-services. SNMP is almost never required on a CP workstation.

## Step-by-step

1. Run the op. If public/private appear, plan to disable SNMP unless the README requires it.
2. If SNMP must stay, change communities on the image (this op is read-only) and firewall 161.
3. Otherwise disable-service for snmpd / SNMP with confirm:true.

## What “good” looks like

- SNMP service disabled, or no default public/private communities.
- No SNMP walk of other hosts in your notes.

## Risks / confirm notes

- Read-only. Do not snmpwalk the LAN, other teams, or network printers as a ‘test.’
- If the README requires SNMP, do not disable it — change the community and restrict it.

## Related ops

- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`disable-service`](./disable-service.md) — Disable a service
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports
- [`audit-ftp-telnet`](./audit-ftp-telnet.md) — Audit FTP and Telnet

