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

function step(opId: string, tip: string): PlaylistStep {
  return { opId, tip };
}

export const PLAYLISTS: readonly Playlist[] = Object.freeze([
  {
    id: "linux-starter",
    title: "Linux starter",
    summary: "First minutes on a Linux image: forensics, accounts, firewall, SSH, banned software.",
    platform: "linux",
    level: "starter",
    emptySuggest: true,
    steps: [
      step(
        "skim-forensics-readme",
        "Copy forensics questions into Team notes before you change anything.",
      ),
      step("list-users", "See who is on this box. Compare names to the image README."),
      step(
        "select-unauthorized-users",
        "Paste the README user list into Allowlists, then see who is extra.",
      ),
      step(
        "flag-suspicious-users",
        "Scores UID 0, never-logged-in, and allowlist misses. Read first — do not disable yet.",
      ),
      step("list-admin-users", "Who has sudo? Cross-check allowed-admins.txt."),
      step(
        "disable-guest-account",
        "Guest is almost never authorized. Live mode will ask before turning it off.",
      ),
      step("audit-password-policy", "Check length and aging before you apply a policy."),
      step("audit-firewall", "Is the host firewall even on?"),
      step("enable-firewall", "Turn it on. Live mode asks first."),
      step(
        "apply-default-deny-inbound",
        "Default-deny inbound, then allow only scored services. Confirms in live mode.",
      ),
      step(
        "ssh-hardening-audit",
        "PermitRootLogin, empty passwords, protocol. Read this before harden-sshd.",
      ),
      step(
        "find-prohibited-software",
        "Inventory nmap/hydra/netcat. Removal is a separate confirm-gated op.",
      ),
      step(
        "scoreboard-preflight",
        "Local checklist only — this never talks to the CCS scoring server.",
      ),
    ],
  },
  {
    id: "windows-starter",
    title: "Windows starter",
    summary: "First minutes on a Windows image: forensics, accounts, firewall, Defender, AutoPlay.",
    platform: "windows",
    level: "starter",
    emptySuggest: true,
    steps: [
      step(
        "skim-forensics-readme",
        "Copy forensics questions into Team notes before you change anything.",
      ),
      step("list-users", "See who is on this box. Compare names to the image README."),
      step(
        "select-unauthorized-users",
        "Paste the README user list into Allowlists, then see who is extra.",
      ),
      step(
        "flag-suspicious-users",
        "Scores Guest, extra admins, and allowlist misses. Read first.",
      ),
      step(
        "disable-guest-account",
        "Guest is almost never authorized. Live mode will ask before turning it off.",
      ),
      step("audit-password-policy", "Check length, lockout, and aging before you apply a template."),
      step("audit-uac", "UAC off is a high Windows finding. Read, then fix with a template."),
      step("audit-firewall", "Are Domain/Private/Public profiles on?"),
      step("enable-firewall", "Turn all profiles on. Live mode asks first."),
      step(
        "enable-windows-defender",
        "Realtime monitoring should be on. Live mode asks first.",
      ),
      step("disable-autoplay", "AutoPlay is a classic plant. Live mode asks first."),
      step(
        "find-prohibited-software",
        "Inventory banned tools. Removal is a separate confirm-gated op.",
      ),
      step(
        "scoreboard-preflight",
        "Local checklist only — this never talks to the CCS scoring server.",
      ),
    ],
  },
  {
    id: "linux-deep",
    title: "Linux deep",
    summary: "After the starter: UID 0, sudo, SSH harden, Telnet/FTP, SUID, cron, kernel.",
    platform: "linux",
    level: "deep",
    steps: [
      step("round-start-wizard", "Huddle list: forensics → users → passwords → firewall → updates."),
      step("audit-uid-zero", "Only root should be UID 0. Extra roots are backdoors."),
      step("check-empty-passwords", "Flags empty/unusable passwords. Never prints hashes."),
      step("audit-sudoers", "NOPASSWD and world-writable sudoers.d files."),
      step("harden-sshd", "PermitRootLogin no, no empty passwords. Live mode asks first."),
      step("disable-root-ssh", "Belt and suspenders after the sshd drop-in."),
      step("enforce-password-policy", "Length 14, history, aging. Does not change existing hashes."),
      step("enable-account-lockout", "faillock after repeated failures. Live mode asks first."),
      step("flag-risky-services", "Telnet, anonymous FTP, and other README-unexpected listeners."),
      step("disable-telnet", "Stop Telnet and block tcp/23. Live mode asks first."),
      step("audit-anonymous-ftp", "vsftpd anonymous/write knobs — not a login test."),
      step("find-suid-sgid", "SUID copies under /tmp and /home are critical."),
      step("find-world-writable", "World-writable cron, sudoers, or PATH dirs."),
      step("audit-cron", "wget|sh and /tmp payloads in crontab/cron.d."),
      step("hunt-shell-backdoors", "Alias hijacks and wget|sh in profile/bashrc."),
      step("harden-sysctl", "No forwarding, syncookies, rp_filter. Live mode asks first."),
      step("post-harden-checklist", "Re-check the image. Read-only — it will not re-apply."),
    ],
  },
  {
    id: "windows-deep",
    title: "Windows deep",
    summary: "After the starter: secedit, auditpol, RDP/RA, SMBv1, LLMNR, IIS, SFC.",
    platform: "windows",
    level: "deep",
    steps: [
      step("round-start-wizard", "Huddle list: forensics → users → passwords → firewall → updates."),
      step(
        "apply-security-template",
        "Import cp-baseline.inf (password, lockout, Guest). Prefer dry-run first.",
      ),
      step("enable-audit-policy", "Success+Failure on the six local categories. Not a log dump."),
      step(
        "import-firewall-profile",
        "Known-good: profiles on, inbound block. Add README ports after.",
      ),
      step("disable-rdp", "Unless the README requires Remote Desktop. Live mode asks first."),
      step("disable-remote-registry", "Workstations do not need Remote Registry."),
      step("disable-remote-assistance", "fAllowToGetHelp=0. Complements disable-rdp."),
      step("disable-smbv1", "SMBv1 is in-scope hardening. Live mode asks first."),
      step("disable-llmnr-netbios-wpad", "Name-resolution shortcuts are common plants."),
      step("audit-null-session", "Anonymous SAM / null sessions. Classification only — no dumps."),
      step("audit-iis", "Anonymous auth, directory browse, samples. Local inventory."),
      step(
        "disable-optional-windows-features",
        "Telnet/TFTP/SMB1 extras from the features list. Live mode asks first.",
      ),
      step("run-sfc-scan", "sfc /verifyonly — report only, no repair."),
      step("post-harden-checklist", "Re-check the image. Read-only — it will not re-apply."),
    ],
  },
  {
    id: "forensics-first",
    title: "Forensics first",
    summary: "Evidence before hardening: README skim, media, hidden binaries, persistence, export.",
    platform: "both",
    level: "forensics",
    emptySuggest: true,
    steps: [
      step(
        "skim-forensics-readme",
        "Keyword-skim local README files. Never contacts CCS or the internet.",
      ),
      step("list-users", "Account inventory for write-ups. Hashes are never listed."),
      step("find-media-files", "mp3/mp4 under homes — snapshot before you delete."),
      step("find-hidden-executables", "Dotfile binaries under homes, /tmp, and Startup."),
      step("hunt-shell-backdoors", "Alias hijacks and profile plants. Do not execute the rc files."),
      step(
        "hunt-sysprep-leftovers",
        "unattend.xml / Panther leftovers. Password values are never printed.",
      ),
      step("audit-hosts-file", "Unexpected redirects of update/AV names."),
      step("find-backdoor-binaries", "nc/ncat in /tmp and :31337 process binaries. Inventory only."),
      step("audit-startup-items", "rc.local, Run keys, Startup folder."),
      step(
        "package-forensics-evidence",
        "Redacted pack: users, ports, persistence. No hashes or private keys.",
      ),
      step("export-evidence-bundle", "One-click redacted bundle for the team scratchpad."),
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
