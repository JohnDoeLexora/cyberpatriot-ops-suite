# Apache/nginx hardening checklist

- **Catalog id:** `audit-web-server`
- **Category:** services
- **Platforms:** linux
- **Risk:** read

> Apache/nginx quick harden checklist: listings, tokens, legacy TLS.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Read-only checklist on local apache2/httpd/nginx config: Options Indexes, ServerTokens, ServerSignature, autoindex, TraceEnable, weak SSLProtocol. Does not disable a README-required web server.

## Why it scores in CyberPatriot

Directory listings and ServerTokens OS are easy Apache points. Weak TLS is a common leftover. A checklist beats grepping five conf files.

## When to run it

When apache2/nginx/httpd is a required service (or running). After list-services.

## Step-by-step

1. Confirm the README still wants the web server. If not, disable-service instead of hardening.
2. Run the op. Fix failing rows on the image (Options -Indexes, ServerTokens Prod, autoindex off, modern SSLProtocol).
3. Re-run. Do not turn off apache2 if it is scored.

## What “good” looks like

- No directory listings, ServerTokens Prod / server_tokens off, no SSLv3/TLSv1.
- Required site still serves.

## Risks / confirm notes

- Read-only. Conf edits are a separate action on the image.
- A wrong SSLProtocol line can break a required HTTPS site — test locally.

## Related ops

- [`list-services`](./list-services.md) — List services
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports
- [`disable-service`](./disable-service.md) — Disable a service

