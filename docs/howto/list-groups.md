# List local groups

- **Catalog id:** `list-groups`
- **Category:** users
- **Platforms:** both
- **Risk:** read

> See group membership, especially privileged groups.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Enumerates local groups and members. Highlights sudo, wheel, Administrators, Hyper-V, Remote Desktop Users, and docker.

## Why it scores in CyberPatriot

docker or Remote Desktop Users can be as powerful as Administrators. Extra membership is a scored misconfiguration.

## When to run it

With list-admin-users; whenever you suspect a user has rights without being in sudo.

## Step-by-step

1. Run the op and scan privileged groups first.
2. Compare members to the README (admins vs standard vs none).
3. Unexpected docker/RDP/Hyper-V members: demote with remove-user-from-admins or the OS group tool; this op is read-only.

## What “good” looks like

- Privileged groups match the README.
- No random users in docker or Remote Desktop Users unless required.

## Risks / confirm notes

- Read-only.
- Do not delete built-in groups. Changing membership is a mutate you should confirm against the README.

## Related ops

- [`list-admin-users`](./list-admin-users.md) — List administrators and sudoers
- [`remove-user-from-admins`](./remove-user-from-admins.md) — Remove user from administrators
- [`audit-rdp`](./audit-rdp.md) — Audit Remote Desktop
- [`audit-sudoers`](./audit-sudoers.md) — Audit sudoers

