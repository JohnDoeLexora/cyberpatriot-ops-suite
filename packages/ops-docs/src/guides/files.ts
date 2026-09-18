import type { HowToBody } from "../types.js";

export const FILES: Record<string, HowToBody> = {
  "find-world-writable": {
    summary: "Hunt world-writable files, especially sudoers, cron, and PATH dirs.",
    what: "Finds world-writable files and directories under /home /etc /opt /tmp /var /usr/local (capped). World-writable sudoers, cron, or PATH dirs are high. Local filesystem only.",
    whyItScores:
      "0777 on /etc/cron.d/hack or /usr/local/bin is a persistence gift. Scoring checks these paths; this is an inventory, not an exploit of them.",
    whenToRun: "Linux files pass, with check-sensitive-file-perms and audit-cron.",
    steps: [
      "Run the op. Prioritize /etc, cron, sudoers, and directories on PATH.",
      "Fix modes on the image (chmod o-w, or delete planted scripts after you snapshot them for forensics).",
      "Re-run. Sticky /tmp is expected; 0777 /usr/local/bin is not.",
    ],
    goodLooksLike: [
      "No world-writable sudoers or cron files.",
      "PATH directories not writable by others.",
      "/tmp may be 1777 (sticky) — that is OK.",
    ],
    risks: [
      "Read-only. chmod/delete is a separate action — snapshot first if a forensics question might need the file.",
      "Do not ‘test’ world-writable sudoers by writing to them.",
    ],
    related: ["check-sensitive-file-perms", "audit-cron", "audit-sudoers", "audit-home-permissions"],
    keywords: ["world-writable", "0777", "chmod o-w", "cron.d"],
  },
  "find-suid-sgid": {
    summary: "List setuid/setgid binaries and flag copies under /tmp /home /opt.",
    what: "Compares SUID/SGID files to a small expected set (passwd, sudo, su, newgrp, ping). SUID copies under /tmp /home /opt /var are critical. Read-only find; does not exploit them.",
    whyItScores:
      "A SUID bash in /tmp is a planted root shell. Expected SUID like /usr/bin/passwd is fine.",
    whenToRun: "Linux files pass, with find-hidden-executables and find-backdoor-binaries.",
    steps: [
      "Run the op. Ignore the known-good set unless the path is wrong.",
      "Anything under /tmp, /home, /opt, /var: snapshot for notes, then remove the SUID bit or the file per team policy.",
      "Re-run until only expected system binaries remain.",
    ],
    goodLooksLike: [
      "Expected: passwd, sudo, su, ping, newgrp in /usr.",
      "No /tmp/suid_bash, no hidden shells in homes.",
    ],
    risks: [
      "Read-only. This is not a guide to using SUID bash.",
      "Removing SUID from /usr/bin/passwd will break password changes — only touch unexpected paths.",
    ],
    related: ["find-hidden-executables", "find-backdoor-binaries", "find-world-writable", "audit-cron"],
    keywords: ["SUID", "SGID", "suid_bash", "find -4000"],
  },
  "find-media-files": {
    summary: "Inventory mp3/mp4/etc. under homes — CP READMEs usually forbid media.",
    what: "Finds mp3/mp4/avi/mkv/mov/flac/wav/ogg under user homes and common stash dirs. Inventory for authorized deletion, not a wipe-without-review.",
    whyItScores: "Prohibited media is a frequent file-category scoring item. Deleting the wrong file can also cost forensics points, so list first.",
    whenToRun: "After the critical user/firewall pass, when you have time to review names.",
    steps: [
      "Run the op. Read each path — is it obviously a song/video, or could it be a forensics exhibit?",
      "If the README forbids media and it is not needed for a question, delete on the image using OS tools.",
      "Re-run until the inventory is empty (or only authorized exceptions).",
    ],
    goodLooksLike: [
      "No prohibited media under homes/Public.",
      "Forensics-related files you kept are documented in team notes.",
    ],
    risks: [
      "Read-only discovery. Blind recursive delete can destroy evidence.",
      "Do not search other teams’ shares.",
    ],
    related: ["find-hidden-executables", "find-prohibited-software", "export-evidence-bundle"],
    keywords: ["mp3", "mp4", "prohibited media", "Movies"],
  },
  "audit-home-permissions": {
    summary: "Homes should not be 777 or owned by the wrong user.",
    what: "Checks that homes are not group/world writable or owned by another user. Mode 777 homes and root-owned user homes are findings.",
    whyItScores: "Open homes leak keys and answers. Root-owned /home/alice can also block the user — both get dinged.",
    whenToRun: "Linux files pass with check-sensitive-file-perms.",
    steps: [
      "Run the op. Note 0777 homes, root-owned user homes, and homes in /tmp.",
      "Fix ownership/mode on the image (typically 750/700, user:user).",
      "Homes in /tmp for planted UID 0 users: disable the user rather than ‘fixing’ a /tmp home.",
    ],
    goodLooksLike: [
      "Each authorized user’s home is owned by that user, not world-writable.",
      "No /tmp/toor as a real home for a live account.",
    ],
    risks: [
      "Read-only.",
      "chmod 700 on a required shared home could break a scored app — README first.",
    ],
    related: ["check-sensitive-file-perms", "find-world-writable", "audit-ssh-authorized-keys", "disable-user"],
    keywords: ["home 0777", "chown", "750", "/tmp/toor"],
  },
  "check-sensitive-file-perms": {
    summary: "passwd/shadow/sudoers/ssh host keys should not be world-readable or writable.",
    what: "Verifies /etc/passwd, shadow, gshadow, group, sudoers, ssh host keys, crontab. shadow should be 000/640 root:shadow — never world-readable. Does not print shadow contents.",
    whyItScores: "World-readable shadow and 0666 sudoers are high findings. The check is permissions, not hash dumping.",
    whenToRun: "Linux files pass, early — these files are also forensics-critical.",
    steps: [
      "Run the op. Anything on shadow/sudoers/ssh keys that is world-readable or writable is urgent.",
      "Fix modes on the image (e.g. shadow 640, sudoers 440, host keys 600).",
      "Re-run. Pair with audit-sudoers if sudoers was writable.",
    ],
    goodLooksLike: [
      "shadow not world-readable, sudoers not writable by others, ssh host keys 600.",
      "No file contents of shadow in the output.",
    ],
    risks: [
      "Read-only. Never cat shadow into notes or tickets.",
      "Wrong chmod on ssh host keys can break sshd — keep sshd running if required.",
    ],
    related: ["audit-sudoers", "find-world-writable", "harden-sshd", "export-evidence-bundle"],
    keywords: ["/etc/shadow 0644", "sudoers 0666", "host key 0644"],
  },
  "audit-ssh-authorized-keys": {
    summary: "Inventory authorized_keys comments and unexpected extra keys.",
    what: "Finds ~/.ssh/authorized_keys (and odd paths). Reports fingerprints and comments, not private keys. Comments like hacker@evil are plants.",
    whyItScores: "A planted key on root is silent remote access. Scoring and persistence hunts both care.",
    whenToRun: "With ssh-hardening-audit, after you know which users should exist.",
    steps: [
      "Run the op. Root should have no random keys unless the README says so.",
      "Remove unexpected public keys on the image (delete the line or the file). Snapshot comments into notes first.",
      "Investigate authorized_keys living in /var/tmp or /tmp — that is persistence.",
    ],
    goodLooksLike: [
      "Only keys you can justify from the README/coach.",
      "No private key material in the output.",
      "No authorized_keys in /tmp or /var/tmp.",
    ],
    risks: [
      "Read-only.",
      "Deleting the only authorized key can lock SSH if passwords are also off — have console.",
    ],
    related: ["ssh-hardening-audit", "harden-sshd", "find-hidden-executables", "list-users"],
    keywords: ["authorized_keys", "hacker@evil", "fingerprint", "root keys"],
  },
  "find-hidden-executables": {
    summary: "Dotfile executables in homes, /tmp, /var/tmp, and Startup folders.",
    what: "Finds executable files whose names start with ‘.’ under homes, /tmp, /var/tmp, and Windows Startup. Classic planted backdoors. Inventory only.",
    whyItScores: ".hidden_shell and .kworker in /tmp are textbook CP plants. Startup folder .update.exe too.",
    whenToRun: "Files/evidence pass with find-suid-sgid and find-backdoor-binaries.",
    steps: [
      "Run the op. Record paths for forensics notes.",
      "If not needed for a question, remove the executable (and the cron/startup that calls it).",
      "Re-run. Pair with audit-cron and audit-startup-items so it does not come back.",
    ],
    goodLooksLike: [
      "No hidden executables in /tmp, /var/tmp, homes, or Startup.",
      "Legitimate dotfiles (.bashrc) are not executable.",
    ],
    risks: [
      "Read-only inventory. Do not execute the hidden file ‘to see what it does.’",
      "Snapshot before delete if a forensics question may reference it.",
    ],
    related: ["find-backdoor-binaries", "audit-cron", "audit-startup-items", "find-suid-sgid"],
    keywords: [".hidden_shell", ".kworker", "Startup", "dotfile executable"],
  },
  "audit-shared-folders": {
    summary: "List Samba/Windows shares with guest, Everyone/Full, and admin shares.",
    what: "Local share config only: guest access, Everyone Full, C$, IPC$. Complements audit-smb.",
    whyItScores: "A public guest-writable share is a high finding even if the SMB service is ‘required.’",
    whenToRun: "With audit-smb. After you know whether file sharing is required.",
    steps: [
      "Run the op. Classify each share: required, guest, world-writable, administrative.",
      "If sharing is not required, disable the service.",
      "If it is required: remove guest, tighten ACLs, drop unexpected public shares.",
    ],
    goodLooksLike: [
      "Only README shares remain.",
      "No guest / Everyone Full.",
      "Admin shares disabled if not required.",
    ],
    risks: [
      "Read-only.",
      "Removing a required share costs points — README names matter.",
    ],
    related: ["audit-smb", "disable-smbv1", "disable-service", "find-world-writable", "audit-share-acls"],
    keywords: ["net share", "Everyone Full", "C$", "guest ok"],
  },
  "audit-share-acls": {
    summary: "Dump Samba options and Windows share ACLs; flag guest/Everyone Full.",
    what: "Inventories Samba share options and Windows SMB share ACLs. Flags guest/Everyone Full, world-writable paths, and administrative shares that should not be exposed on a workstation. Read-only; does not modify ACLs.",
    whyItScores:
      "Guest + Everyone Full on a public share is a high finding even when SMB is required. ACL dumps show who can write, not just that the share exists.",
    whenToRun: "With audit-shared-folders and audit-smb, after you know whether sharing is required.",
    steps: [
      "Run the op. Note guest, Everyone Full, world-writable paths, and C$/admin shares.",
      "If sharing is not required, disable the service (confirm:true on disable-service / disable-smbv1 as appropriate).",
      "If it is required: drop guest, tighten ACLs on the image, remove unexpected public shares.",
      "Re-run until only README shares remain with tight ACLs.",
    ],
    goodLooksLike: [
      "No guest / Everyone Full.",
      "Admin shares disabled if not required.",
      "Remaining share paths not world-writable.",
    ],
    risks: [
      "Read-only. Does not modify ACLs or enumerate other machines.",
      "Removing a required share costs points — README names matter.",
    ],
    related: ["audit-shared-folders", "audit-smb", "disable-smbv1", "find-world-writable"],
    keywords: ["Everyone Full", "guest ok", "C$", "icacls", "smb.conf"],
  },
  "audit-critical-perm-drift": {
    summary: "Mode/ACL check for shadow, sudoers, SSH host keys, and Windows SAM — no dumps.",
    what: "Read-only mode/ACL check for /etc/shadow, gshadow, sudoers, ssh host keys, and Windows SAM/SYSTEM ACLs via icacls. Flags world-readable shadow or Everyone-readable SAM. Does not dump SAM, hashes, or private keys.",
    whyItScores:
      "World-readable shadow or a 0666 sudoers file is a classic plant. Scoring checks modes; hashes must never leave the box.",
    whenToRun: "Linux/Windows files pass with check-sensitive-file-perms.",
    steps: [
      "Run the op. Treat 0644 shadow, 0666 sudoers, or Everyone:(R) on SAM as fire.",
      "Fix modes on the image (typically shadow 000/640 root:shadow, sudoers 440, host keys 600). This op does not mutate.",
      "Re-run. Pair with find-world-writable so a writable sudoers.d file does not sneak back.",
    ],
    goodLooksLike: [
      "shadow/gshadow not world-readable.",
      "sudoers 440/400, ssh host keys 600.",
      "SAM/SYSTEM not Everyone-readable. No hashes in the result.",
    ],
    risks: [
      "Read-only. Never dump SAM, shadow hashes, or private keys into notes.",
      "chmod of /usr host keys is fine; do not chmod -R /etc blindly.",
    ],
    related: [
      "check-sensitive-file-perms",
      "find-world-writable",
      "audit-sudoers",
      "audit-ssh-authorized-keys",
    ],
    keywords: ["shadow 0644", "sudoers 0666", "icacls SAM", "host key 0644", "no hashes"],
  },
};
