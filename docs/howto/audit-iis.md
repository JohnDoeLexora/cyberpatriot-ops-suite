# IIS feature inventory + anonymous auth

- **Catalog id:** `audit-iis`
- **Category:** windows
- **Platforms:** windows
- **Risk:** read

> Inventory IIS features and flag anonymous auth plus directory browsing.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Lists enabled IIS-* optional features and reads anonymousAuthentication / directoryBrowse. Local Windows image only. Does not dump site content.

## Why it scores in CyberPatriot

IIS anonymous + directory browsing is a high Windows web finding. Sample apps are extra points. You still must not disable a README-required site.

## When to run it

Windows services pass when IIS is present. Pair with audit-anonymous-ftp if FTP is under IIS.

## Step-by-step

1. Run the op. Note which IIS features are enabled and whether anonymous/directory browsing is on.
2. If IIS is not required, plan to disable the feature/service (separate mutate).
3. If it is required: turn off anonymous (unless the README wants a public site) and directory browsing on the image.

## What “good” looks like

- IIS absent, or anonymous auth off unless required, directory browsing off, samples gone.
- No site-content dump in the result.

## Risks / confirm notes

- Read-only.
- Disabling IIS when the README requires a website costs the whole web check — README first.

## Related ops

- [`list-services`](./list-services.md) — List services
- [`audit-anonymous-ftp`](./audit-anonymous-ftp.md) — Audit anonymous FTP / vsftpd
- [`disable-service`](./disable-service.md) — Disable a service
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports

