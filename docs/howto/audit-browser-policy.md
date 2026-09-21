# Audit browser homepage / proxy / extensions

- **Catalog id:** `audit-browser-policy`
- **Category:** files
- **Platforms:** both
- **Risk:** read

> Deepen browser baseline: homepage, proxy, and extension ids (no cookies).

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads Firefox/Chrome/Edge/IE homepage, proxy/PAC, and extension directory *ids*. Cookies, history, saved passwords, and extension source are never dumped. Complements audit-browser-baseline and hunt-remote-access-tools.

## Why it scores in CyberPatriot

A planted homepage or system proxy to a contest box is a common extras item and how images phone home. Extension ids tell you what to remove without copying payloads.

## When to run it

With audit-browser-baseline and hunt-remote-access-tools, after users/firewall.

## Step-by-step

1. Run the op. Note unexpected homepages (10.x, pwn) and system proxies.
2. Fix policies.json / IE settings on the image (this op is read-only). Remove leftover extension directories after a snapshot.
3. Confirm cookies and passwords are absent from the result.

## What “good” looks like

- Homepage is about:blank or a README page. No 10.x proxy.
- Extension ids listed without source. No cookies/passwords.

## Risks / confirm notes

- Read-only. Do not dump cookies or saved passwords into the coach packet.
- Authorized-image only.

## Related ops

- [`audit-browser-baseline`](./audit-browser-baseline.md) — Audit Firefox/IE/Edge security baseline
- [`hunt-remote-access-tools`](./hunt-remote-access-tools.md) — Hunt remote-access tools and browser extensions
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`export-coach-packet`](./export-coach-packet.md) — Export redacted coach packet ZIP

