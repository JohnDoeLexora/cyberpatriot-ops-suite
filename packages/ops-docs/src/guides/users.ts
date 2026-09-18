import type { HowToBody } from "../types.js";

export const USERS: Record<string, HowToBody> = {
  "list-users": {
    summary: "Inventory every local account so you know who lives on the image.",
    what: "Lists local users with UID/SID, home/profile, shell, groups, lock state, and last login. Password hashes are never listed. This is the phone book for every later user op.",
    whyItScores:
      "CyberPatriot images almost always hide extra accounts, leftover vendor users, or a second root. You cannot lock or demote what you have not found, and README-required users that are missing are findings too.",
    whenToRun:
      "First five minutes of the round, then again after you disable or lock anyone so the inventory matches reality.",
    steps: [
      "Open this op and Run it (demo mode is safe and does not touch the host).",
      "Put the README authorized-user list next to the output (or config/allowed-users.txt).",
      "Highlight names that are not on the README and names the README promised that are missing.",
      "Do not delete yet — note UID 0, Guest, never-logged-in humans, and extra admins for the specialized ops.",
      "Re-run after each account change so your evidence stays current.",
    ],
    goodLooksLike: [
      "Every README human is present and enabled.",
      "No surprise interactive accounts (toor, hacker123, flag, test).",
      "Output never includes password hashes or private keys.",
    ],
    risks: [
      "Read-only: this op does not disable or delete anyone.",
      "Service accounts (www-data, sshd, daemon) are supposed to exist — do not treat them as backdoors just because they are not in the README.",
      "Authorized-image inventory only. Never point this at another team’s host.",
    ],
    related: ["flag-suspicious-users", "list-admin-users", "audit-uid-zero", "disable-user"],
    keywords: ["getent passwd", "net user", "lusrmgr", "inventory", "local accounts"],
  },
  "flag-suspicious-users": {
    summary: "Heuristic scoring so you know which accounts to lock first.",
    what: "Scores local accounts using never-logged-in humans, weird shells, UID weirdness, homes outside /home, throwaway name patterns, recent creates, and missing allowlist entries. Extra admins not on the README score higher. This is a bulk audit with reasons — not credential dumping.",
    whyItScores:
      "Planted backdoors are often named toor/hacker/flag, given UID 0, or never used. A ranked list beats scrolling passwd under time pressure and feeds disable/lock/remove-from-admins.",
    whenToRun:
      "Right after list-users, before you mutate anything. Re-run after lock/disable to confirm scores dropped.",
    steps: [
      "Confirm config/allowed-users.txt matches this image’s README (edit the allowlist if the README differs).",
      "Run the op. Read the reasons column, not just the numeric score.",
      "Triage: UID 0 aliases and extra admins first, then throwaway names, then never-logged-in humans.",
      "For each hit, check the README once more — authorized coaches and service accounts can look odd.",
      "Hand the remaining names to disable-user, lock-user, or remove-user-from-admins. Do not delete homes; forensics questions may need them.",
    ],
    goodLooksLike: [
      "README users (alice, bob, coach, …) score clean.",
      "toor, hacker123, Guest, and similar plants are at the top with written reasons.",
      "No hashes in the output — only scores and reasons.",
    ],
    risks: [
      "Heuristics are not the official CCS score. Do not chase a number instead of the README.",
      "Read-only. Acting on a false positive (locking a required user) is a mutate op with confirm:true.",
      "Never used to attack other teams or scoring endpoints.",
    ],
    related: [
      "list-users",
      "audit-uid-zero",
      "disable-user",
      "remove-user-from-admins",
      "score-image-heuristics",
    ],
    keywords: ["heuristic", "allowlist", "toor", "never logged in", "suspicion score"],
  },
  "disable-user": {
    summary: "Turn off an unauthorized account without destroying the record.",
    what: "Disables a local account (usermod/nologin or Disable-LocalUser) so it cannot log in. The account row remains for evidence. Homes are not deleted.",
    whyItScores:
      "Unauthorized interactive users are a staple scoring item. Disabling is safer than deleting because forensics questions and README checks may still need the username and home.",
    whenToRun:
      "After flag-suspicious-users / list-users, and only for names the README does not authorize.",
    steps: [
      "Run list-users or flag-suspicious-users and write down the exact username.",
      "Read the README twice. If the user is listed as authorized, stop.",
      "Prefer dryRun:true first — the result should describe the lock/shell change without applying it.",
      "Live mode requires confirm:true. Pass the username; do not delete the home directory.",
      "Re-run list-users and try (in your notes) to confirm the account is disabled/locked.",
    ],
    goodLooksLike: [
      "Unauthorized user still listed but enabled=false / shell nologin / locked.",
      "Home directory still on disk.",
      "Required README users remain active.",
    ],
    risks: [
      "Mutation. Live mode is refused without confirm:true. dryRun:true previews without confirm.",
      "Never disable root or a README-required admin unless the README says so.",
      "Do not userdel. Deleting homes can wipe forensics evidence.",
      "Authorized image only.",
    ],
    related: ["lock-user", "flag-suspicious-users", "list-users", "disable-guest-account"],
    keywords: ["usermod", "Disable-LocalUser", "nologin", "unauthorized", "confirm"],
  },
  "lock-user": {
    summary: "Lock the password so the account cannot authenticate, but keep the record.",
    what: "Locks a local account password (passwd -l / usermod -L, or the Windows lock equivalent) without removing the user. Different from disable-user mainly in the mechanism; both stop logins.",
    whyItScores:
      "Some checklists want the account present but unable to log in (especially service-like humans or stale authorized users you are not allowed to delete).",
    whenToRun:
      "When the README still lists the person as a user but you need to stop a known-default or compromised password, or when disable-user is too heavy.",
    steps: [
      "Confirm the username on the image and in the README.",
      "dryRun:true to see the before/after lock bit.",
      "Live: confirm:true plus the username.",
      "Re-run list-users; the account should show locked and still exist.",
    ],
    goodLooksLike: [
      "Account remains in the inventory with a locked/password-disabled flag.",
      "No home deletion.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Locking a required service account can break a scored service — check required-services and the README.",
      "This is not a password-cracking tool and never prints hashes.",
    ],
    related: ["disable-user", "expire-user-password", "check-empty-passwords", "list-users"],
    keywords: ["passwd -l", "usermod -L", "lock password", "confirm"],
  },
  "remove-user-from-admins": {
    summary: "Drop extra sudo/Administrators members down to standard users.",
    what: "Removes a user from Administrators / sudo / wheel. The account stays enabled as a normal user — preferred when the README lists them as standard, not admin.",
    whyItScores:
      "Extra admins are high-value points. Deleting the user can be wrong if they are a required standard account; demoting them is the kosher fix.",
    whenToRun:
      "After list-admin-users. Anyone in sudo/Administrators who is not an authorized admin on the README.",
    steps: [
      "Run list-admin-users and tick README-approved admins.",
      "For extras, confirm they should remain as standard users (not disabled entirely).",
      "dryRun:true, then live with confirm:true and the username.",
      "Re-run list-admin-users; they should disappear from sudo/Administrators but still appear in list-users.",
    ],
    goodLooksLike: [
      "sudo/Administrators matches the README allowlist.",
      "Demoted users can still exist as standard accounts.",
      "root / Administrator RID-500 remains as expected for the OS.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Removing the last authorized admin can lock your team out of the image — keep one README admin.",
      "Do not confuse this with disable-user.",
    ],
    related: ["list-admin-users", "audit-sudoers", "list-groups", "disable-user"],
    keywords: ["sudo", "wheel", "Administrators", "demote", "confirm"],
  },
  "list-admin-users": {
    summary: "Show who actually has admin / UID 0 / sudo rights.",
    what: "Lists members of Administrators, sudo, wheel, and UID 0. Cross-checks the README allowlist so extra admins jump out.",
    whyItScores:
      "Privilege is scored separately from “user exists.” A standard user who is also in sudo is a finding even if the name looks friendly.",
    whenToRun: "Immediately after list-users, and again after remove-user-from-admins.",
    steps: [
      "Run the op with the allowlist path if you customized config/allowed-users.txt.",
      "Circle names that are admin but not on the README as admins.",
      "Note UID 0 duplicates (toor) — those also belong in audit-uid-zero.",
      "Feed extras to remove-user-from-admins or disable-user.",
    ],
    goodLooksLike: [
      "Only README admins plus the OS built-in (root / Administrator).",
      "No NOPASSWD surprises (pair with audit-sudoers).",
    ],
    risks: [
      "Read-only.",
      "Windows built-in Administrator and Linux root are expected; do not “fix” them by deletion.",
    ],
    related: ["remove-user-from-admins", "audit-sudoers", "audit-uid-zero", "list-groups"],
    keywords: ["sudo", "Administrators", "UID 0", "wheel", "allowlist"],
  },
  "audit-uid-zero": {
    summary: "Find every account with UID 0 — only root should own UID 0.",
    what: "Reads passwd for UID 0. Extra UID 0 names (toor, sync-with-shell, etc.) are classic Linux backdoors. Windows is out of scope for this op.",
    whyItScores:
      "A second UID 0 user is root. Scoring engines love this plant. It is one of the highest-priority user findings on Linux images.",
    whenToRun: "In the first pass of user audits, before you spend time on media files.",
    steps: [
      "Run the op. Expect root. Anything else is a problem.",
      "Record home and shell for extras (often /tmp/toor).",
      "Disable or lock the extra account with disable-user / lock-user — do not try to “reassign UID” under the clock.",
      "Re-run until only root has UID 0.",
    ],
    goodLooksLike: [
      "Exactly one UID 0 row: root, shell a normal admin shell, home /root.",
      "No toor, no second root in /tmp.",
    ],
    risks: [
      "Read-only. Disabling the extra account is a separate mutate op (confirm:true).",
      "Do not delete root. Do not experiment with usermod -u 0 on other users.",
      "This is an inventory, not a privilege-escalation recipe.",
    ],
    related: ["audit-duplicate-uids", "flag-suspicious-users", "disable-user", "list-admin-users"],
    keywords: ["UID 0", "toor", "duplicate root", "passwd"],
  },
  "check-empty-passwords": {
    summary: "Find accounts that can log in with no password.",
    what: "Classifies accounts as empty / locked / set using shadow or Windows PasswordRequired. It never prints hashes — only the boolean class.",
    whyItScores:
      "Empty-password Guest or human accounts are easy points and an open door on the image. CP images often ship Guest or games this way.",
    whenToRun: "With the first user pass, especially before you connect the image to a network you care about.",
    steps: [
      "Run the op. Note anyone classified empty or PasswordRequired=false.",
      "README check: Guest should almost always be disabled, not given a password.",
      "Authorized humans with empty passwords: expire-user-password or set a strong password through the OS tools; do not dump hashes.",
      "Re-run until no interactive account is empty.",
    ],
    goodLooksLike: [
      "Human accounts: password set (or locked if unauthorized).",
      "Guest disabled.",
      "Output has no hash strings.",
    ],
    risks: [
      "Read-only. This is not John/hashcat and must never become a cracker.",
      "Setting passwords is a manual/OS step; this op only detects emptiness.",
    ],
    related: ["disable-guest-account", "expire-user-password", "audit-password-policy", "lock-user"],
    keywords: ["empty password", "nullok", "PasswordRequired", "Guest", "shadow"],
  },
  "audit-never-logged-in": {
    summary: "Human accounts that have never logged in are often leftover or planted.",
    what: "Compares lastlog / LastLogon for interactive accounts against the allowlist. Service accounts with nologin are ignored.",
    whyItScores:
      "Competition images frequently include a never-used admin or a ‘flag’ user waiting for you. Never-logged-in is a cheap, high-signal filter.",
    whenToRun: "Right after list-users; pair with flag-suspicious-users.",
    steps: [
      "Run the op. Ignore nologin system UIDs.",
      "If a never-logged-in name is not on the README, disable or lock it.",
      "If it is on the README, it may still be fine — some authorized users simply have not logged in yet.",
    ],
    goodLooksLike: [
      "Remaining never-logged-in humans are README-authorized.",
      "Planted names (flag, nologin_admin) are disabled.",
    ],
    risks: [
      "Read-only.",
      "A required user who has not logged in yet is not automatically a backdoor.",
    ],
    related: ["flag-suspicious-users", "disable-user", "list-users", "check-user-shells"],
    keywords: ["lastlog", "LastLogon", "never logged in", "flag user"],
  },
  "check-user-shells": {
    summary: "Interactive users get a real shell; system users should not.",
    what: "Reports login shells. Humans should be bash/sh (or the distro default). System users should be nologin/false. Interpreters, /tmp shells, and empty shells are suspicious.",
    whyItScores:
      "A python3 or /tmp/shell login shell is a planted backdoor pattern. A system UID with /bin/bash is also a finding.",
    whenToRun: "During the Linux user pass, with audit-uid-zero and flag-suspicious-users.",
    steps: [
      "Run the op on the Linux image.",
      "For each weird shell: check the README, then disable the user or set a proper shell via the OS — this op itself is read-only.",
      "System accounts with bash: report and typically lock/nologin them if not required.",
    ],
    goodLooksLike: [
      "Authorized humans: /bin/bash or /bin/sh.",
      "UID < 1000 (except root): nologin or false.",
      "No /tmp/*, no python/perl as a login shell.",
    ],
    risks: [
      "Read-only. Changing shells is a separate system change; prefer disable-user if the account is unauthorized.",
      "csh/zsh is not automatically evil — but on a bash CP image it is unusual; check the README.",
    ],
    related: ["flag-suspicious-users", "disable-user", "audit-uid-zero", "find-hidden-executables"],
    keywords: ["/etc/passwd", "nologin", "login shell", "python3 shell"],
  },
  "list-groups": {
    summary: "See group membership, especially privileged groups.",
    what: "Enumerates local groups and members. Highlights sudo, wheel, Administrators, Hyper-V, Remote Desktop Users, and docker.",
    whyItScores:
      "docker or Remote Desktop Users can be as powerful as Administrators. Extra membership is a scored misconfiguration.",
    whenToRun: "With list-admin-users; whenever you suspect a user has rights without being in sudo.",
    steps: [
      "Run the op and scan privileged groups first.",
      "Compare members to the README (admins vs standard vs none).",
      "Unexpected docker/RDP/Hyper-V members: demote with remove-user-from-admins or the OS group tool; this op is read-only.",
    ],
    goodLooksLike: [
      "Privileged groups match the README.",
      "No random users in docker or Remote Desktop Users unless required.",
    ],
    risks: [
      "Read-only.",
      "Do not delete built-in groups. Changing membership is a mutate you should confirm against the README.",
    ],
    related: ["list-admin-users", "remove-user-from-admins", "audit-rdp", "audit-sudoers"],
    keywords: ["/etc/group", "net localgroup", "docker", "Remote Desktop Users"],
  },
  "disable-guest-account": {
    summary: "Turn Guest off. It is almost never authorized on CP images.",
    what: "Disables the Guest / guest account on Windows and Linux. The account remains listed but cannot log in.",
    whyItScores:
      "Guest with a blank password is a classic scoring item on both platforms. README almost never asks you to keep it.",
    whenToRun: "Early, as soon as you confirm the README does not require Guest (it won’t, 99% of the time).",
    steps: [
      "Skim the README for the word Guest. If it is required (rare), stop.",
      "dryRun:true, then live with confirm:true. No username param — it targets Guest.",
      "Re-run list-users / check-empty-passwords; Guest should be disabled.",
    ],
    goodLooksLike: [
      "Guest exists but enabled=false / cannot log in.",
      "No empty-password Guest finding.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "If a forensics question mentions Guest, disable still; do not delete the account.",
    ],
    related: ["check-empty-passwords", "list-users", "disable-user", "audit-uac"],
    keywords: ["Guest", "guest account", "blank password", "confirm"],
  },
  "audit-duplicate-uids": {
    summary: "Two names sharing one UID break auditing and can hide a root alias.",
    what: "Finds distinct usernames that share a UID. Duplicate UID 0 is critical; other collisions still matter.",
    whyItScores:
      "A second name with UID 0 is root by another name. Non-zero duplicates confuse logs and file ownership — both are findings.",
    whenToRun: "Together with audit-uid-zero on Linux.",
    steps: [
      "Run the op. Treat any UID 0 collision as urgent.",
      "Disable the extra name (disable-user). Do not try to ‘merge’ the UIDs.",
      "Re-run until each UID maps to one username (plus expected system aliases if the distro documents them).",
    ],
    goodLooksLike: ["No two human usernames share a UID.", "root is the only UID 0 name."],
    risks: [
      "Read-only.",
      "Some distros have aliases; still, CP images that plant toor are not ‘aliases’ — they are backdoors to disable.",
    ],
    related: ["audit-uid-zero", "disable-user", "list-users", "flag-suspicious-users"],
    keywords: ["duplicate UID", "toor", "passwd collision"],
  },
  "expire-user-password": {
    summary: "Force an authorized user to set a new password at next login.",
    what: "Expires a password (chage -d 0 / net user /logonpasswordchg:yes) without locking the account. For README users with stale or known-default passwords.",
    whyItScores:
      "Authorized accounts with default passwords are scored. Expiring is the kosher way to force a change without inventing a password in the write-up.",
    whenToRun:
      "After you confirm the user is authorized and you suspect a default/stale password. Not for unauthorized users — disable those instead.",
    steps: [
      "Confirm the username is on the README.",
      "dryRun:true, then live confirm:true.",
      "Do not paste a new password into this tool; the user (or your team, locally) sets it at next login per team policy.",
    ],
    goodLooksLike: [
      "Account still enabled.",
      "Aging shows must-change at next login.",
      "Unauthorized users were not expired — they were disabled.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Expiring root/Administrator can be painful mid-round; prefer authorized humans first.",
      "This is not a password reset that prints or emails secrets.",
    ],
    related: ["check-password-aging", "enforce-password-policy", "lock-user", "check-empty-passwords"],
    keywords: ["chage", "logonpasswordchg", "expire", "default password", "confirm"],
  },
};
