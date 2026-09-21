# Audit database bind-address / anonymous

- **Catalog id:** `audit-database-bind`
- **Category:** services
- **Platforms:** linux
- **Risk:** read

> If MySQL/MariaDB/Postgres is installed, flag 0.0.0.0 bind and pg_hba trust.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads bind-address / listen_addresses, skip-grant-tables, and pg_hba trust. Does not connect with credentials, dump user tables, or print passwords.

## Why it scores in CyberPatriot

A database listening on all interfaces or with trust-from-anywhere is a high LAMP finding. Querying mysql.user is unnecessary and can leak hashes.

## When to run it

Linux LAMP pass with audit-web-server and audit-php-hardening.

## Step-by-step

1. Run the op. If no DB is installed, you are done.
2. README: is MySQL/Postgres required? If not, plan disable-service. If yes, bind to 127.0.0.1 and drop trust.
3. Confirm the output has no passwords or SQL result sets.

## What “good” looks like

- bind-address 127.0.0.1 (or DB absent). No skip-grant-tables. No 0.0.0.0/0 trust.
- No SQL connections were made.

## Risks / confirm notes

- Read-only. Do not mysql -u root without a password as an ‘exploit’ — that is still credential use; just fix the config.
- Authorized-image only. Do not scan other databases.

## Related ops

- [`audit-php-hardening`](./audit-php-hardening.md) — Audit PHP expose_php / dangerous functions
- [`audit-web-server`](./audit-web-server.md) — Apache/nginx hardening checklist
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`disable-service`](./disable-service.md) — Disable a service

