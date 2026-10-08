import { catalog, getOp } from "./catalog.js";
import type { Platform } from "./types.js";

/**
 * Ordered round sequences. Each step is an existing catalog op id.
 * Playlists never invent ops, never contact CCS, and never skip confirm
 * on live mutations — the dashboard/API still run the engine as usual.
 */

export const PLAYLIST_IDS = [
  "linux-starter",
  "windows-starter",
  "linux-deep",
  "windows-deep",
  "forensics-first",
] as const;

export type PlaylistId = (typeof PLAYLIST_IDS)[number];

export type PlaylistLevel = "starter" | "deep" | "forensics";

export interface PlaylistStep {
  /** Existing catalog op id. */
  opId: string;
  /** Short coach tip shown next to the step. */
  tip: string;
  /** Why this step is next, in scoring order. */
  whyNow: string;
}

export interface Playlist {
  id: PlaylistId;
  title: string;
  summary: string;
  platform: Platform;
  level: PlaylistLevel;
  /** Suggested on an empty beginner workspace. */
  emptySuggest?: boolean;
  steps: readonly PlaylistStep[];
}

function step(opId: string, tip: string, whyNow: string): PlaylistStep {
  return { opId, tip, whyNow };
}

export const PLAYLISTS: readonly Playlist[] = Object.freeze([
  {
    id: "linux-starter",
    title: "Linux starter",
    summary:
      "For a first-time Linux teammate in the opening 25–40 minutes: answer forensics, then accounts, passwords, firewall, updates, banned tools, insecure services, SSH, and logging.",
    platform: "linux",
    level: "starter",
    emptySuggest: true,
    steps: [
      step(
        "skim-forensics-readme",
        "Copy forensics questions into Team notes before you change anything.",
        "Questions first. A later delete can erase the only copy of an answer.",
      ),
      step(
        "list-users",
        "See who is on this box. Compare names to the image README.",
        "You cannot judge extra accounts until you have the full list.",
      ),
      step(
        "select-unauthorized-users",
        "Paste the README user list into Allowlists, then see who is extra.",
        "The allowlist is the README. Extras are the people to lock next.",
      ),
      step(
        "flag-suspicious-users",
        "Scores UID 0, never-logged-in, and allowlist misses. Read first.",
        "A ranked list beats guessing which odd name is the plant.",
      ),
      step(
        "list-admin-users",
        "Who has sudo? Cross-check allowed-admins.txt.",
        "Extra admins score even when the account itself is allowed.",
      ),
      step(
        "disable-guest-account",
        "Guest is almost never authorized. Live mode asks before turning it off.",
        "Guest is the usual blank-password door, before you touch password rules.",
      ),
      step(
        "audit-password-policy",
        "Check length and aging before you apply a policy.",
        "Read the rules now that the obvious Guest account is handled.",
      ),
      step("audit-firewall", "Is the host firewall even on?", "See the current door policy before you flip it."),
      step("enable-firewall", "Turn it on. Live mode asks first.", "Firewall off is an early, high-value finding."),
      step(
        "apply-default-deny-inbound",
        "Block new inbound connections. Allow only README services after.",
        "On is not enough if every new listener is still allowed in.",
      ),
      step(
        "check-pending-updates",
        "See which security patches are waiting. This does not install them.",
        "Know the update gap before you spend the round on a long upgrade.",
      ),
      step(
        "find-prohibited-software",
        "Inventory nmap, hydra, and netcat. Removal is a separate confirm.",
        "Banned tools score while they stay installed. List them before you delete.",
      ),
      step(
        "audit-ftp-telnet",
        "See if Telnet or FTP is installed. This does not log in.",
        "Clear-text remote login is the next service to turn off.",
      ),
      step(
        "ssh-hardening-audit",
        "Read root login and blank passwords before harden-sshd.",
        "SSH is the remote door you will keep. Read it before you edit it.",
      ),
      step(
        "audit-logging",
        "Check that the box is actually recording events.",
        "Logging is the record of every change you are about to make.",
      ),
      step(
        "scoreboard-preflight",
        "Local checklist only. This never talks to the scoring server.",
        "One last local pass before the deeper fixes.",
      ),
    ],
  },
  {
    id: "windows-starter",
    title: "Windows starter",
    summary:
      "For a first-time Windows teammate in the opening 25–40 minutes: forensics, accounts, passwords, Guest and UAC, firewall, updates, banned tools, Remote Desktop, Defender, and logging.",
    platform: "windows",
    level: "starter",
    emptySuggest: true,
    steps: [
      step(
        "skim-forensics-readme",
        "Copy forensics questions into Team notes before you change anything.",
        "Questions first. Cleanup can delete the file an answer lives in.",
      ),
      step(
        "list-users",
        "See who is on this box. Compare names to the image README.",
        "Account points start with a complete local user list.",
      ),
      step(
        "select-unauthorized-users",
        "Paste the README user list into Allowlists, then see who is extra.",
        "Extras against the allowlist are the disable list.",
      ),
      step(
        "flag-suspicious-users",
        "Scores Guest, extra admins, and allowlist misses. Read first.",
        "Use the reasons column before you turn anyone off.",
      ),
      step(
        "list-admin-users",
        "Who is in Administrators? Cross-check allowed-admins.txt.",
        "An allowed user with admin rights is still a finding.",
      ),
      step(
        "disable-guest-account",
        "Guest is almost never authorized. Live mode asks before turning it off.",
        "Guest is the usual no-password account, before you touch password rules.",
      ),
      step(
        "audit-password-policy",
        "Check length, lockout, and aging before you apply a template.",
        "Read the policy now that Guest is off, before any template import.",
      ),
      step(
        "audit-uac",
        "UAC off is a high Windows finding. Read, then fix with a template.",
        "The 'are you sure?' prompt should be on before you chase smaller items.",
      ),
      step("audit-firewall", "Are Domain, Private, and Public profiles on?", "See all three profiles before you enable them."),
      step("enable-firewall", "Turn all profiles on. Live mode asks first.", "A firewall that is off is early points."),
      step(
        "check-pending-updates",
        "See if Windows Update has patches waiting. This does not install them.",
        "Updates are next, after the door is shut.",
      ),
      step(
        "find-prohibited-software",
        "Inventory banned tools. Removal is a separate confirm.",
        "Hacking tools and games score until they are removed.",
      ),
      step(
        "audit-ftp-telnet",
        "See if Telnet or FTP services are still installed.",
        "Clear-text services are the insecure-service check before you disable them.",
      ),
      step(
        "audit-rdp",
        "Is Remote Desktop on? Leave it if the README requires it.",
        "Read Remote Desktop before the deep playlist turns it off.",
      ),
      step(
        "enable-windows-defender",
        "Real-time protection should be on. Live mode asks first.",
        "Built-in antivirus off is a standard Windows plant.",
      ),
      step("disable-autoplay", "AutoPlay is a classic plant. Live mode asks first.", "Stop disks from launching programs by themselves."),
      step("audit-logging", "Check that Windows is recording Security events.", "You want a record before the deeper policy changes."),
      step(
        "scoreboard-preflight",
        "Local checklist only. This never talks to the scoring server.",
        "Close the starter with a local remaining-work pass.",
      ),
    ],
  },
  {
    id: "linux-deep",
    title: "Linux deep",
    summary:
      "For the same Linux image after the starter, about 40–70 minutes: lockout, root and sudo, the password policy fix, updates, Telnet and FTP, SSH hardening, logs, then file and kernel hygiene.",
    platform: "linux",
    level: "deep",
    steps: [
      step(
        "round-start-wizard",
        "Huddle list if you skipped the starter. It changes nothing.",
        "Confirm forensics and accounts are done before these writes.",
      ),
      step(
        "check-empty-passwords",
        "Flags blank passwords. It never prints hashes.",
        "Blank passwords are the account hole the starter list did not classify.",
      ),
      step("audit-sudoers", "Look for NOPASSWD and sudoers files anyone can edit.", "Admin rules are the next privilege check after the admin list."),
      step(
        "enable-account-lockout",
        "Lock out after repeated bad passwords. Live mode asks first.",
        "Stop guessing once you know the password rules are weak.",
      ),
      step("audit-uid-zero", "Only root should be user id 0. Extra roots are backdoors.", "A second root is more urgent than a normal extra user."),
      step(
        "lock-root-account",
        "Lock the root password. sudo for README admins still works.",
        "Direct root login should die after you know who has sudo.",
      ),
      step(
        "enforce-password-policy",
        "Length 14, history, aging. Does not change existing hashes.",
        "Apply the policy you already audited in the starter.",
      ),
      step(
        "apply-security-updates",
        "Install distro updates. Live mode asks first.",
        "Install the patches the starter only listed.",
      ),
      step(
        "enable-unattended-upgrades",
        "Turn on daily security updates. Live mode asks first.",
        "The next patch should arrive without a person at the keyboard.",
      ),
      step("find-media-files", "Find music and video. Do not delete until questions are answered.", "Media is prohibited, but forensics may name the file."),
      step(
        "remove-games-samples",
        "Remove games named in the games list. Live mode asks first.",
        "Sample games are the prohibited-software fix after the inventory.",
      ),
      step("disable-telnet", "Stop the Telnet service. Live mode asks first.", "Telnet was the insecure service the starter only detected."),
      step(
        "disable-legacy-r-services",
        "Stop rsh. Live mode asks first. Repeat for rlogin if it exists.",
        "Old remote shells are the same class of hole as Telnet.",
      ),
      step("audit-anonymous-ftp", "Read anonymous FTP settings. This is not a login test.", "See the FTP knobs before you rewrite them."),
      step("harden-vsftpd", "Turn anonymous FTP off. Live mode asks first.", "Anonymous upload is the FTP fix."),
      step("harden-sshd", "No root login, no blank passwords. Live mode asks first.", "Apply the SSH settings the starter audit already showed."),
      step("disable-root-ssh", "Second lock on root SSH after the drop-in file.", "Belt and suspenders on the remote root door."),
      step("check-auditd", "Is the Linux audit daemon recording?", "Deeper logging after the starter's basic log check."),
      step("find-suid-sgid", "SUID copies under /tmp and home folders are critical.", "File hygiene starts with programs that run as root."),
      step("find-world-writable", "World-writable cron, sudoers, or PATH directories.", "Anyone-can-edit files are the next permission pass."),
      step("audit-cron", "Look for download-and-run lines in scheduled jobs.", "Scheduled jobs keep running after you lock the user."),
      step("restrict-cron-at", "Allow only root to add cron and at jobs.", "Stop planted users from scheduling the next command."),
      step("hunt-shell-backdoors", "Alias hijacks in profile files. Do not run those files.", "Startup shell files are persistence after cron."),
      step("harden-sysctl", "No forwarding, SYN cookies, reverse-path filter. Asks first.", "Kernel network switches are the deep network pass."),
      step("post-harden-checklist", "Re-check the image. Read-only. It will not re-apply.", "Prove the fixes stuck before you call the image done."),
    ],
  },
  {
    id: "windows-deep",
    title: "Windows deep",
    summary:
      "For the same Windows image after the starter, about 40–70 minutes: security template, firewall profile, updates, insecure services, Remote Desktop, audit policy, IIS, then a verify-only system-file check.",
    platform: "windows",
    level: "deep",
    steps: [
      step(
        "round-start-wizard",
        "Huddle list if you skipped the starter. It changes nothing.",
        "Do not import a template until forensics and accounts are done.",
      ),
      step(
        "apply-security-template",
        "Import the baseline template (password, lockout, Guest). Dry-run first.",
        "This is the password and lockout fix the starter only read.",
      ),
      step(
        "enable-account-lockout",
        "Five bad guesses then a short lock. Live mode asks first.",
        "Lockout belongs with the password policy, before service cleanup.",
      ),
      step(
        "import-firewall-profile",
        "Profiles on, inbound blocked. Add README ports after.",
        "A known-good firewall policy is the deeper firewall pass.",
      ),
      step(
        "apply-security-updates",
        "Start Windows Update on the image. Live mode asks first.",
        "Install what the starter only reported as pending.",
      ),
      step(
        "remove-games-samples",
        "Remove built-in games and sample apps. Live mode asks first.",
        "Games are the prohibited-software removal after the inventory.",
      ),
      step("disable-rdp", "Turn Remote Desktop off unless the README needs it.", "The starter only read Remote Desktop. This is the fix."),
      step("disable-smbv1", "Turn off old SMB sharing. Live mode asks first.", "SMBv1 is the unsafe file-sharing dialect."),
      step("disable-smb-client-v1", "Turn off the SMBv1 client too.", "The client dialect can stay on after the server feature is gone."),
      step(
        "disable-optional-windows-features",
        "Telnet, TFTP, and SMB1 extras from the features list.",
        "Optional features are how those insecure services got installed.",
      ),
      step("disable-llmnr-netbios-wpad", "Turn off name-guessing shortcuts.", "Local name spoofing is the next network plant."),
      step("disable-remote-registry", "Workstations do not need Remote Registry.", "Remote Registry is an insecure management service."),
      step("disable-remote-assistance", "Stop help-desk remote control of the desktop.", "It is a second remote path beside Remote Desktop."),
      step("audit-null-session", "Can anonymous users list accounts? No dumps.", "Read anonymous access before you harden it."),
      step("harden-null-session", "Block anonymous account listing. Live mode asks first.", "This is the null-session fix."),
      step("enable-audit-policy", "Record success and failure. This is not a log dump.", "Audit policy is the logging fix after services are quiet."),
      step("audit-iis", "Anonymous sites and samples. Local inventory only.", "Web role findings come after the remote-access holes."),
      step("run-sfc-scan", "sfc /verifyonly. Report only, no repair.", "System-file integrity is a late check and does not rewrite files."),
      step("post-harden-checklist", "Re-check the image. Read-only. It will not re-apply.", "Confirm the template and service changes are still in effect."),
    ],
  },
  {
    id: "forensics-first",
    title: "Forensics first",
    summary:
      "For whoever is answering questions, the first 15–30 minutes, before anyone changes the image: read local notes, then collect evidence without deleting it.",
    platform: "both",
    level: "forensics",
    emptySuggest: true,
    steps: [
      step(
        "skim-forensics-readme",
        "Keyword-skim local README files. Never contacts the scoring server.",
        "Write the questions down before any other step deletes a file.",
      ),
      step("list-users", "Account inventory for the write-up. Hashes are never listed.", "Many questions name a user. Capture the list while it is intact."),
      step(
        "hunt-sysprep-leftovers",
        "Find unattend and sysprep files. Password values are never printed.",
        "Answer files often hold the original secret. Find them before cleanup.",
      ),
      step("audit-hosts-file", "Look for update or antivirus names sent to a dead address.", "A hosts sinkhole is both a finding and a clue."),
      step("find-media-files", "Music and video under home folders. Snapshot before anyone deletes.", "Questions often name a song or video. Record the path first."),
      step("find-hidden-executables", "Hidden programs under homes, temp, and Startup.", "Hidden files are easy to miss and easy to delete too soon."),
      step("find-backdoor-binaries", "Netcat and similar tools. Inventory only. Do not run them.", "A tool in temp may be the subject of a question."),
      step("hunt-shell-backdoors", "Alias hijacks and profile plants. Do not execute the files.", "Startup scripts can hide the answer and a backdoor together."),
      step("audit-startup-items", "Boot scripts, Run keys, and the Startup folder.", "What runs at logon is part of the persistence story."),
      step(
        "package-forensics-evidence",
        "Redacted pack. No hashes or private keys.",
        "Hand the notes to the team while the image is still unchanged.",
      ),
      step("export-evidence-bundle", "One redacted bundle for the scratchpad.", "A second export for the person writing the answers."),
    ],
  },
]);

const byId = new Map(PLAYLISTS.map((p) => [p.id, p]));

export function getPlaylist(id: string | null | undefined): Playlist | undefined {
  if (!id) return undefined;
  return byId.get(id as PlaylistId);
}

const TEAM_BEGINNER = ["local-notes", "local-journal", "local-pins"] as const;

const BEGINNER_PLAYLIST_IDS: readonly PlaylistId[] = [
  "linux-starter",
  "windows-starter",
  "forensics-first",
];

const extraBeginner = ["one-click-hardening-checklist", "round-start-wizard"] as const;

export function beginnerOpIds(): Set<string> {
  const ids = new Set<string>([...TEAM_BEGINNER, ...extraBeginner]);
  for (const pl of PLAYLISTS) {
    if (!BEGINNER_PLAYLIST_IDS.includes(pl.id)) continue;
    for (const s of pl.steps) ids.add(s.opId);
  }
  return ids;
}

const beginnerSet = beginnerOpIds();

export function isBeginnerOp(opId: string): boolean {
  return beginnerSet.has(opId);
}

export function coachTipFor(opId: string, playlistId?: string | null): string | undefined {
  const pl = getPlaylist(playlistId) ?? PLAYLISTS.find((p) => p.steps.some((s) => s.opId === opId));
  return pl?.steps.find((s) => s.opId === opId)?.tip;
}

export function assertPlaylistsIntegrity(ops = catalog): void {
  const opIds = new Set(ops.map((o) => o.id));
  if (PLAYLISTS.length !== PLAYLIST_IDS.length) {
    throw new Error(`Expected ${PLAYLIST_IDS.length} playlists, found ${PLAYLISTS.length}`);
  }
  const seenPlaylist = new Set<string>();
  for (const id of PLAYLIST_IDS) {
    const pl = getPlaylist(id);
    if (!pl) throw new Error(`Missing required playlist: ${id}`);
  }
  for (const pl of PLAYLISTS) {
    if (seenPlaylist.has(pl.id)) throw new Error(`Duplicate playlist id: ${pl.id}`);
    seenPlaylist.add(pl.id);
    if (!pl.title.trim()) throw new Error(`Missing playlist title: ${pl.id}`);
    if (!pl.summary.trim()) throw new Error(`Missing playlist summary: ${pl.id}`);
    if (pl.steps.length < 8) {
      throw new Error(`Playlist ${pl.id} needs at least 8 steps, has ${pl.steps.length}`);
    }
    const seenOp = new Set<string>();
    for (const s of pl.steps) {
      if (!opIds.has(s.opId)) {
        throw new Error(`Playlist ${pl.id} references unknown op '${s.opId}'`);
      }
      if (seenOp.has(s.opId)) {
        throw new Error(`Playlist ${pl.id} repeats op '${s.opId}'`);
      }
      seenOp.add(s.opId);
      const tip = s.tip.trim();
      if (!tip) throw new Error(`Empty tip for ${pl.id}/${s.opId}`);
      if (tip.length > 160) {
        throw new Error(`Tip too long (${tip.length}) for ${pl.id}/${s.opId}`);
      }
      const whyNow = s.whyNow.trim();
      if (!whyNow) throw new Error(`Empty whyNow for ${pl.id}/${s.opId}`);
      if (whyNow.length > 160) {
        throw new Error(`whyNow too long (${whyNow.length}) for ${pl.id}/${s.opId}`);
      }
      const op = getOp(s.opId);
      const required = op?.paramsSchema.required ?? [];
      if (required.length) {
        throw new Error(
          `Playlist ${pl.id} step ${s.opId} has required params (${required.join(", ")}); playlists must run with empty params`,
        );
      }
    }
  }
}
