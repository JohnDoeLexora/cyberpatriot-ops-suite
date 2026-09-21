# Audit PHP expose_php / dangerous functions

- **Catalog id:** `audit-php-hardening`
- **Category:** services
- **Platforms:** linux
- **Risk:** read

> If PHP is present, flag expose_php, allow_url_include, and info.php.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads php.ini knobs and inventories info.php/phpinfo.php by name under web roots. File contents are not dumped. disable_functions is reported as a list, not as an exploit recipe.

## Why it scores in CyberPatriot

expose_php and phpinfo pages leak versions; allow_url_include is a classic LAMP plant. Scoring wants those off on a required web server.

## When to run it

With audit-web-server on a LAMP image.

## Step-by-step

1. Run the op. Note expose_php, allow_url_include, and any info.php path.
2. If the web server is required, edit php.ini on the image (this op is read-only) and remove info.php after you snapshot.
3. Do not use dangerous functions as an attack path. The list is for disable_functions hardening.

## What “good” looks like

- expose_php=Off, allow_url_include=Off, no info.php in the web root — or PHP absent.
- info.php contents were not printed.

## Risks / confirm notes

- Read-only. Deleting info.php is a separate file action after a forensics check.
- Not an exploit guide. Authorized-image only.

## Related ops

- [`audit-web-server`](./audit-web-server.md) — Apache/nginx hardening checklist
- [`audit-database-bind`](./audit-database-bind.md) — Audit database bind-address / anonymous
- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables
- [`audit-iis`](./audit-iis.md) — IIS feature inventory + anonymous auth

