import type { HowToBody } from "../types.js";

export const AUTH: Record<string, HowToBody> = {
  "audit-password-policy": {
    summary: "Read min length, aging, history, and complexity — then compare to a CP baseline.",
    what: "Reads /etc/login.defs + PAM pwquality/cracklib, or net accounts / secedit: length, aging, history, complexity. Compare to typical CP baselines (length 12–14+, history, max age).",
    whyItScores:
      "Weak policy (minlen 8, max age 99999, no complexity) is a reliable chunk of points on both platforms.",
    whenToRun: "After the first user inventory, before you apply enforce-password-policy.",
    steps: [
      "Run the op and list every finding (short minlen, no history, never-expires).",
      "Skim the README for a required policy; if silent, use the conservative baseline this suite documents (length 14, history 5, max 90).",
      "Fix with enforce-password-policy rather than hand-editing five files under the clock.",
    ],
    goodLooksLike: [
      "Min length ≥ 12–14, complexity on, history remembered, max age not 99999.",
      "Inactive/lockout policy present (pair with enable-account-lockout).",
    ],
    risks: [
      "Read-only. Applying policy is a mutate op with confirm:true.",
      "Do not weaken policy to ‘match a guessing attack’ — this is defensive only.",
    ],
    related: ["enforce-password-policy", "check-password-aging", "audit-pam", "enable-account-lockout"],
    keywords: ["login.defs", "pwquality", "net accounts", "secpol", "minlen"],
  },
  "enforce-password-policy": {
    summary: "Apply a conservative CP-friendly password policy without touching existing hashes.",
    what: "Writes min length 14, remember 5, max age 90, min age 1, complexity on, inactive lock. Does not change existing password hashes.",
    whyItScores:
      "The audit op finds the gap; this op is the fix. Scoring checks the policy files/objects, not whether you cracked anyone.",
    whenToRun: "After audit-password-policy, once you know the README does not demand a weaker custom policy.",
    steps: [
      "Run audit-password-policy and keep the output as before-evidence.",
      "dryRun:true to see which files/objects would change.",
      "Live: confirm:true. Existing user hashes are not rewritten.",
      "Re-run the audit. For authorized users with known defaults, use expire-user-password separately.",
    ],
    goodLooksLike: [
      "Audit comes back clean against the baseline.",
      "Users can still log in with current passwords until they expire naturally or you expire them.",
    ],
    risks: [
      "Mutation. Live requires confirm:true. dryRun:true previews.",
      "A too-strict policy can lock your team out if you also expire everyone at once — do not combine blindly.",
      "Never used to attack password-guessing on other hosts.",
    ],
    related: ["audit-password-policy", "expire-user-password", "enable-account-lockout", "audit-pam"],
    keywords: ["pwquality", "net accounts", "min length 14", "confirm"],
  },
  "check-password-aging": {
    summary: "Spot human accounts with max days -1/99999 or aging disabled.",
    what: "Parses chage/shadow aging fields without hashes. Flags unlimited max age on human accounts.",
    whyItScores: "PASS_MAX_DAYS 99999 is a default the scoring engine loves to ding. Root aging disabled is often OK; bob with 99999 is not.",
    whenToRun: "Linux auth pass, with audit-password-policy.",
    steps: [
      "Run the op. Ignore system accounts.",
      "For humans with 99999/-1: either enforce-password-policy (global) or chage the user; this op is read-only.",
      "Re-check authorized users after policy apply.",
    ],
    goodLooksLike: [
      "Human max age in a sane range (e.g. 90).",
      "No hashes printed.",
    ],
    risks: [
      "Read-only.",
      "Do not expire a required service account that cannot interactively change a password.",
    ],
    related: ["enforce-password-policy", "expire-user-password", "audit-password-policy"],
    keywords: ["chage", "PASS_MAX_DAYS", "99999", "aging"],
  },
  "audit-pam": {
    summary: "Look for nullok, missing faillock, and missing pwquality in PAM.",
    what: "Inspects common-auth / system-auth for pam_pwquality, pam_tally2/faillock, pam_unix remember, and nullok. nullok is high; missing faillock is medium.",
    whyItScores:
      "nullok means empty passwords are allowed at the PAM layer even if shadow looks fine. Missing lockout means password-guessing on the local console is unlimited.",
    whenToRun: "Linux auth pass, before enable-account-lockout and enforce-password-policy.",
    steps: [
      "Run the op. Treat nullok as fire — it must go.",
      "Note missing pwquality and faillock; those are the mutate ops.",
      "Do not hand-edit PAM as your first move unless you know the distro; prefer the suite’s mutate ops.",
    ],
    goodLooksLike: [
      "No nullok.",
      "pwquality or cracklib present.",
      "faillock or tally2 present with a deny threshold.",
    ],
    risks: [
      "Read-only. A broken PAM file can lock everyone out — that is why mutate ops exist.",
      "This is not a guide to bypass PAM.",
    ],
    related: ["enable-account-lockout", "enforce-password-policy", "check-empty-passwords"],
    keywords: ["PAM", "nullok", "faillock", "pwquality", "common-auth"],
  },
  "enable-account-lockout": {
    summary: "Lock the local account after repeated failed passwords.",
    what: "Enables PAM faillock or Windows lockout after failures (deny=5, unlock_time=600). Stops password-guessing on this image only.",
    whyItScores: "Lockout policy is a standard auth scoring item. It is defensive, local, and expected.",
    whenToRun: "After audit-pam / audit-password-policy, once you know you will not lock yourselves out during testing.",
    steps: [
      "Run the matching audit so you have a before picture.",
      "dryRun:true, then live confirm:true.",
      "Re-run audit-pam / audit-password-policy; faillock or lockout threshold should be present.",
    ],
    goodLooksLike: [
      "deny=5 (or README value) and a non-zero unlock time.",
      "Your team can still log in with the correct password.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "A very low threshold plus a shared team password can lock you during the round — 5/10 minutes is the conservative default.",
      "This does not attack other hosts and is not an online bruteforce tool.",
    ],
    related: ["audit-pam", "audit-password-policy", "enforce-password-policy"],
    keywords: ["faillock", "lockoutthreshold", "deny=5", "confirm"],
  },
  "disable-root-ssh": {
    summary: "Stop the root account from logging in through SSH.",
    what: "Sets PermitRootLogin no in sshd_config and reloads ssh if it is a required service.",
    whyItScores:
      "PermitRootLogin yes is one of the most common Linux network findings. Scoring checks the sshd config, not whether you can brute-force root.",
    whenToRun: "After ssh-hardening-audit, if the README still wants SSH itself (usually yes).",
    steps: [
      "Run ssh-hardening-audit. Confirm SSH is a required service.",
      "Keep a sudo user session open so you do not lock the team out.",
      "dryRun:true, then live confirm:true.",
      "Re-run the audit; PermitRootLogin should be no. Pair with harden-sshd for the rest of the checklist.",
    ],
    goodLooksLike: [
      "PermitRootLogin no.",
      "sshd still running if the README requires SSH.",
      "A non-root README admin can still sudo.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "If you have no sudo user other than root, you can strand the image — check list-admin-users first.",
      "Does not listen on other machines; local sshd only.",
    ],
    related: ["ssh-hardening-audit", "harden-sshd", "list-admin-users", "disable-user"],
    keywords: ["PermitRootLogin", "sshd_config", "root login", "confirm"],
  },
  "audit-sudoers": {
    summary: "Find NOPASSWD, unexpected ALL=(ALL), and world-writable sudoers files.",
    what: "Reads /etc/sudoers and sudoers.d. Does not execute sudo as other users.",
    whyItScores:
      "NOPASSWD: ALL for a random user is a planted privilege path. World-writable sudoers is even worse because anyone can add themselves.",
    whenToRun: "With list-admin-users on Linux. Before you demote users.",
    steps: [
      "Run the op. Note NOPASSWD lines and files that are world-writable.",
      "Compare sudoers names to the README admins.",
      "World-writable sudoers files: fix permissions with check-sensitive-file-perms follow-up; do not leave 0666.",
      "Unexpected NOPASSWD users: remove-user-from-admins or edit sudoers via visudo on the image (not this read op).",
    ],
    goodLooksLike: [
      "Only README admins have sudo.",
      "No NOPASSWD unless the README truly requires a specific command.",
      "sudoers files not world-writable.",
    ],
    risks: [
      "Read-only. A syntax error in sudoers can lock out sudo — use visudo if you edit by hand.",
      "This is not a privilege-escalation cookbook.",
    ],
    related: [
      "list-admin-users",
      "remove-user-from-admins",
      "check-sensitive-file-perms",
      "find-world-writable",
    ],
    keywords: ["NOPASSWD", "sudoers.d", "visudo", "world-writable sudoers"],
  },
  "audit-uac": {
    summary: "Check that Windows User Account Control is actually on.",
    what: "Reads EnableLUA, ConsentPromptBehaviorAdmin, and PromptOnSecureDesktop. UAC disabled is a high finding.",
    whyItScores: "EnableLUA=0 is a common Windows plant. Scoring checks the registry values.",
    whenToRun: "Windows auth pass, with disable-guest-account and audit-rdp.",
    steps: [
      "Run the op. If EnableLUA is 0, UAC is off — that is the finding.",
      "This op is read-only; turn UAC back on with the Windows settings / registry using a confirmed team procedure.",
      "Re-run until EnableLUA=1 and the admin prompt is not ‘elevate without asking.’",
    ],
    goodLooksLike: [
      "EnableLUA=1.",
      "Admin consent prompt not set to ‘elevate without asking’.",
      "Secure desktop prompt on.",
    ],
    risks: [
      "Read-only.",
      "Do not disable UAC to ‘make scripts easier.’",
    ],
    related: ["disable-guest-account", "audit-password-policy", "enable-windows-defender", "audit-rdp"],
    keywords: ["UAC", "EnableLUA", "ConsentPromptBehaviorAdmin"],
  },
  "report-password-never-expires": {
    summary: "Combine never-expires aging with blank-password classification — no hashes.",
    what: "Joins password-aging (shadow MAX_DAYS -1/99999 or Windows PasswordNeverExpires) with empty-password classification. Human accounts that never expire, especially with a blank password, are high. Never prints hashes — only empty/locked/set plus never-expires booleans.",
    whyItScores:
      "Guest with a blank never-expiring password is a two-finding plant. Aging-off humans stay scored even when the password is set.",
    whenToRun: "Auth pass with check-empty-passwords and check-password-aging.",
    steps: [
      "Run the op. Sort empty+never-expires first (Guest, games, planted humans).",
      "Disable Guest; lock or expire authorized humans; enforce-password-policy for the global max-age.",
      "Do not print or copy hashes. Re-run until empty+never-expires is gone for humans.",
    ],
    goodLooksLike: [
      "No human with empty password + never-expires.",
      "Authorized humans have a max age (e.g. 90), not 99999.",
      "Result shows empty/locked/set only — never a hash.",
    ],
    risks: [
      "Read-only. Hashes are never returned.",
      "Do not expire a required service account that cannot change a password interactively.",
    ],
    related: [
      "check-empty-passwords",
      "check-password-aging",
      "disable-guest-account",
      "enforce-password-policy",
    ],
    keywords: ["PasswordNeverExpires", "MAX_DAYS 99999", "blank password", "Guest", "no hashes"],
  },
};
