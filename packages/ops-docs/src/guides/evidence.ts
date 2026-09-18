import type { HowToBody } from "../types.js";

export const EVIDENCE: Record<string, HowToBody> = {
  "export-evidence-bundle": {
    summary: "One-click redacted evidence pack for notes and forensics write-ups.",
    what: "Assembles a redacted local pack: user inventory (no hashes), listeners, services, firewall state, checksums of sshd_config/sudoers/hosts, plus a notes.md snippet. Never copies shadow hashes, private keys, or off-image data.",
    whyItScores:
      "Forensics questions and team handoff need artifacts. A redacted bundle is faster than screenshots and stays inside the rules.",
    whenToRun: "After major passes (users, firewall, files) and before you submit forensics answers. Also at the end of the round.",
    steps: [
      "Run the op in demo or live read mode — it does not mutate.",
      "Skim the bundle: counts, top findings, checksums.",
      "Copy only what you need into the forensics notepad. Do not add shadow or id_rsa files by hand.",
    ],
    goodLooksLike: [
      "Bundle contains inventories and checksums, not secrets.",
      "notes.md snippet is something you could show a coach.",
    ],
    risks: [
      "Read-only. Still: do not zip private keys into the pack.",
      "Not off-image exfiltration and not a scoring-server upload.",
    ],
    related: [
      "one-click-hardening-checklist",
      "score-image-heuristics",
      "list-users",
      "audit-listening-ports",
      "package-forensics-evidence",
    ],
    keywords: ["evidence", "checksums", "notes.md", "redacted"],
  },
  "package-forensics-evidence": {
    summary: "Deeper redacted forensics pack: persistence, share ACLs, perm drift, checksums.",
    what: "Builds a redacted forensics pack with user/service/port inventories, persistence hints, share ACLs, critical permission drift, and config checksums. Never copies shadow hashes, SAM contents, private keys, or off-image data. For authorized-image write-ups only.",
    whyItScores:
      "Forensics questions often want persistence and ACL evidence, not just a user list. One redacted pack beats ad-hoc screenshots.",
    whenToRun: "After the first persistence and files pass, and again before you submit forensics answers.",
    steps: [
      "Run the op in demo or live read mode — it does not mutate.",
      "Skim persistence, share ACLs, and perm-drift sections. Copy only what a forensics question needs.",
      "Do not add shadow, SAM, or id_rsa files by hand. Keep the pack on the image.",
    ],
    goodLooksLike: [
      "Pack has inventories, ACLs, perm drift, and checksums — not secrets.",
      "notes.md snippet is something you could show a coach.",
    ],
    risks: [
      "Read-only. Still: do not zip private keys or hashes into the pack.",
      "Not off-image exfiltration and not a scoring-server upload.",
    ],
    related: [
      "export-evidence-bundle",
      "audit-persistence-deep",
      "audit-share-acls",
      "audit-critical-perm-drift",
    ],
    keywords: ["forensics pack", "checksums", "share ACLs", "perm drift", "redacted"],
  },
  "one-click-hardening-checklist": {
    summary: "Read-only dashboard of pass/fail/warn rows pointing at the fix ops.",
    what: "Covers users, admins, guest, password policy, firewall, telnet/ftp, listening ports, prohibited software, media, SSH/UAC. Each row points at the mutate op to fix it. Does not change the image.",
    whyItScores:
      "This is the ‘what is left’ view so the team does not forget Guest or the firewall while hunting SUID. It is not a CCS cheat.",
    whenToRun: "Start of the round (baseline), whenever you need a huddle, and near the end.",
    steps: [
      "Run the op. Sort fail/warn first.",
      "Open the linked mutate/read op from each failing row and follow that how-to.",
      "Re-run the checklist; remaining fails should shrink.",
    ],
    goodLooksLike: [
      "Required services still pass.",
      "Guest, firewall, telnet, extra admins go green after their mutate ops.",
    ],
    risks: [
      "Read-only. Fixes still need confirm:true on the mutate ops.",
      "Not the official scoreboard. Do not query scoring endpoints.",
    ],
    related: [
      "score-image-heuristics",
      "flag-suspicious-users",
      "audit-firewall",
      "disable-guest-account",
      "scoreboard-preflight",
      "post-harden-checklist",
    ],
    keywords: ["checklist", "pass/fail", "preflight", "remaining work"],
  },
  "scoreboard-preflight": {
    summary: "Local pre-round checklist: firewall, guest, time, logging, telnet, allowlist, ports.",
    what: "Pre-competition local checklist covering firewall, guest, time sync, logging, no telnet, allowlist users, and expected ports. Explicitly does not contact the CCS scoring server, other teams, or the internet beyond the image’s configured update/time sources. Pair failing rows with confirm:true mutate ops.",
    whyItScores:
      "These are the first-hour misses that cost easy points. The checklist is a huddle tool, not a way to query or game the official scoreboard.",
    whenToRun: "Start of the round, and after any big mutate batch before you walk away.",
    steps: [
      "Run the op. Sort fail rows first.",
      "Open the linked mutate/read op from each failing row and follow that how-to (confirm:true on live mutates).",
      "Re-run. Do not point this tool at scoring URLs — it will not, and you must not.",
    ],
    goodLooksLike: [
      "Firewall on, Guest off, telnet gone, time in sync, logging up.",
      "Allowlist users match the README; expected ports present.",
      "No attempt to reach CCS or other teams.",
    ],
    risks: [
      "Read-only. Fixes still need confirm:true on the mutate ops.",
      "Not the official scoreboard. Do not query scoring endpoints or other images.",
    ],
    related: [
      "one-click-hardening-checklist",
      "audit-firewall",
      "disable-guest-account",
      "diff-expected-ports",
    ],
    keywords: ["preflight", "CCS is not queried", "guest", "firewall", "expected ports"],
  },
  "post-harden-checklist": {
    summary: "After-action verification: policy, SSH/UAC, UID 0, media, RATs, default-deny.",
    what: "After-action verification on the authorized image: password policy, SSH/UAC, extra UID 0, empty/never-expire passwords, media, prohibited software, default-deny firewall, remote-access tools. Read-only — does not re-apply hardening. Each fail points at the mutate op.",
    whyItScores:
      "End-of-round leaks (media, extra root, RATs still installed) are avoidable. A second checklist after you think you are done catches them.",
    whenToRun: "After the main harden pass, and once more in the last 15 minutes.",
    steps: [
      "Run the op. Treat remaining fails as the last work list.",
      "Follow each linked op; live mutates still need confirm:true.",
      "Re-run until remaining fails are README exceptions you can explain in notes.",
    ],
    goodLooksLike: [
      "No extra UID 0, no empty+never-expire humans, Guest off.",
      "Firewall default-deny, no RATs, no prohibited media/software.",
      "SSH/UAC hardened if those platforms apply.",
    ],
    risks: [
      "Read-only. Does not re-apply hardening for you.",
      "Not CCS. Do not hide logs or delete evidence to make rows green.",
    ],
    related: [
      "one-click-hardening-checklist",
      "score-image-heuristics",
      "hunt-remote-access-tools",
      "report-password-never-expires",
    ],
    keywords: ["post-harden", "verification", "default-deny", "UID 0", "remaining fails"],
  },
  "score-image-heuristics": {
    summary: "A 0–100 remaining-work index with drill-down — not the official CCS score.",
    what: "Aggregates suspicion across users, services, ports, and files. Higher means more left to harden. Dashboard headline with drill-down findings. Heuristic only — not the official CCS score.",
    whyItScores:
      "It does not score you on CCS. It helps the team pick the next fire. Treating it as the scoreboard is a mistake.",
    whenToRun: "Anytime you need a single number for huddle, plus at the end to sanity-check leftovers.",
    steps: [
      "Run the op. Read top drivers (UID 0, port 31337, telnet, empty Guest) not just the integer.",
      "Work those drivers with the matching ops.",
      "Re-run; the remaining-work index should fall. If it does not, you fixed the wrong thing.",
    ],
    goodLooksLike: [
      "Top drivers match what you already found in specialized ops.",
      "Number trending down after real fixes.",
    ],
    risks: [
      "Read-only heuristic. Not CCS. Not a scoring-server client.",
      "Do not optimize the number by hiding logs or deleting evidence.",
    ],
    related: [
      "one-click-hardening-checklist",
      "flag-suspicious-users",
      "audit-listening-ports",
      "export-evidence-bundle",
    ],
    keywords: ["remaining-work index", "not the official CCS score", "heuristic", "top drivers"],
  },
  "find-backdoor-binaries": {
    summary: "Heuristic filenames/locations: nc in /tmp, SUID bash copies, 31337 process binaries.",
    what: "Looks for nc/netcat/ncat/socat in /tmp /home /opt, suid copies of bash, meterpreter-like names, and binaries bound to 31337. Does not include exploit payloads or attack other hosts.",
    whyItScores:
      "Loose reverse-admin tools in /tmp are plants. This is filename/location hygiene, not malware development.",
    whenToRun: "With find-hidden-executables, find-suid-sgid, and audit-listening-ports.",
    steps: [
      "Run the op. Snapshot paths into notes.",
      "Do not execute the binary. Remove it after you know no forensics question needs the name.",
      "Disable the user/cron/startup that dropped it.",
      "Re-run plus audit-listening-ports.",
    ],
    goodLooksLike: [
      "No nc/ncat in /tmp or homes.",
      "No process on :31337.",
      "Expected system binaries in /usr only.",
    ],
    risks: [
      "Read-only. Never run the found binary ‘to confirm.’",
      "Name matches can false-positive — check the path.",
      "No exploit payloads, no off-image attacks.",
    ],
    related: [
      "find-hidden-executables",
      "find-suid-sgid",
      "audit-listening-ports",
      "find-prohibited-software",
    ],
    keywords: ["/tmp/nc", "ncat", "31337", "hidden_shell", "socat"],
  },
};
