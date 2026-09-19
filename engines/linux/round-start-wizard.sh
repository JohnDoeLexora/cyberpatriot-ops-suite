#!/usr/bin/env bash
# Read-only sequenced round-start guide. Does not mutate. CCS is never contacted.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
echo '{"ok":true,"sequence":["skim-forensics-readme","sync-authorized-users","enforce-password-policy","enable-firewall","apply-security-updates","find-prohibited-software"],"ccsContacted":false,"note":"Open each related catalog op. Mutations still need confirm:true."}'
