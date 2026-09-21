import { asBoolean } from "../safety.js";
import type { EngineContext, Finding, RunData, RunResult } from "../types.js";
import {
  demoBrowserPolicy,
  demoCoachPacket,
  demoCredentialGuard,
  demoDatabaseBind,
  demoDnsClient,
  demoIpv6,
  demoKernelModules,
  demoLogPersistence,
  demoLsaProtection,
  demoMailServices,
  demoNullSession,
  demoPhpHardening,
  demoPowershellConstrained,
  demoPrintSpooler,
  demoSecureBoot,
  demoSmbClientV1,
  demoSnapFlatpak,
  demoTimeTimezone,
  demoUsbStorage,
  demoWifiProfiles,
  demoWindowsRoles,
} from "./fixtures.js";

function pack(
  ctx: EngineContext,
  summary: string,
  data: RunData,
  findings: Finding[] = [],
  warnings: string[] = [],
): RunResult {
  return {
    opId: ctx.op.id,
    title: ctx.op.title,
    category: ctx.op.category,
    platforms: ctx.op.platforms,
    risk: ctx.op.risk,
    mode: "demo",
    ok: true,
    startedAt: ctx.now.toISOString(),
    finishedAt: ctx.now.toISOString(),
    summary,
    findings,
    data,
    warnings,
    engine: "demo",
  };
}

function mutateNote(ctx: EngineContext, action: string): string {
  const dry = asBoolean(ctx.params.dryRun, false);
  if (dry) return `DEMO dry-run: would ${action}. No host changes.`;
  return `DEMO simulated: ${action}. Fixtures only — the host was not modified.`;
}

/** Specialized demo fixtures for the cp-10 depth pack. */
export function runCp10Demo(ctx: EngineContext): RunResult | undefined {
  switch (ctx.op.id) {
    case "harden-print-spooler":
      return pack(
        ctx,
        mutateNote(ctx, "restrict PointAndPrint and disable remote spooler RPC"),
        {
          extra: { ...demoPrintSpooler, applied: !asBoolean(ctx.params.dryRun, false), simulated: true },
        },
        [
          {
            id: "pnp",
            severity: "critical",
            title: "PointAndPrint driver install unrestricted",
            detail: "NoWarningNoElevationOnInstall=1 (PrintNightmare-class).",
            remediationOpId: "harden-print-spooler",
          },
        ],
      );
    case "audit-lsa-protection":
      return pack(ctx, "LSA RunAsPPL is off (hashes not dumped).", { extra: demoLsaProtection }, [
        {
          id: "runasppl",
          severity: "high",
          title: "RunAsPPL=0",
          detail: "LSA is not a protected process.",
          remediationOpId: "audit-lsa-protection",
        },
      ]);
    case "audit-credential-guard":
      return pack(ctx, "Credential Guard is not running (secrets omitted).", { extra: demoCredentialGuard }, [
        {
          id: "cg",
          severity: "medium",
          title: "Credential Guard not running",
          detail: "Informational; enable only if the README/image supports VBS.",
        },
      ]);
    case "audit-secure-boot":
      return pack(ctx, "Secure Boot is off; firmware is in Setup Mode.", { extra: demoSecureBoot }, [
        {
          id: "sb",
          severity: "high",
          title: "Secure Boot disabled",
          detail: "SetupMode=true. PK/KEK material not dumped.",
        },
      ]);
    case "audit-wifi-profiles":
      return pack(
        ctx,
        "3 saved WLAN profiles (keys omitted).",
        { extra: { profiles: demoWifiProfiles, keysOmitted: true } },
        [
          {
            id: "open",
            severity: "high",
            title: "Open Wi-Fi profile CP-GUEST",
            detail: "Open authentication. PSK not present.",
            resource: "CP-GUEST",
          },
          {
            id: "home",
            severity: "medium",
            title: "Leftover Wi-Fi profile HomeRouter",
            detail: "WPA2-PSK leftover (key omitted).",
            resource: "HomeRouter",
          },
        ],
      );
    case "harden-powershell-constrained": {
      const constrained = asBoolean(ctx.params.constrainedLanguage, false);
      return pack(
        ctx,
        mutateNote(ctx, constrained ? "enable PS logging + Constrained Language" : "enable PS ScriptBlock/Module logging and transcription"),
        {
          extra: {
            ...demoPowershellConstrained,
            LanguageMode: constrained ? "ConstrainedLanguage" : "FullLanguage",
            simulated: true,
            transcriptionPath: "C:\\ProgramData\\cp-ops\\ps-transcripts",
          },
        },
        [
          {
            id: "sbl",
            severity: "medium",
            title: "Script Block Logging off before harden",
            remediationOpId: "harden-powershell-constrained",
          },
        ],
      );
    }
    case "disable-smb-client-v1":
      return pack(
        ctx,
        mutateNote(ctx, "disable SMBv1 client leftovers (mrxsmb10 / EnableSMB1Protocol)"),
        { extra: { ...demoSmbClientV1, simulated: true } },
        [
          {
            id: "smb1c",
            severity: "high",
            title: "SMBv1 client still enabled",
            detail: "EnableSMB1Protocol=true on the workstation.",
            remediationOpId: "disable-smb-client-v1",
          },
        ],
      );
    case "audit-dns-client":
      return pack(ctx, "DNS client points at an unexpected 10.13.37.1; DoH unset.", { extra: demoDnsClient }, [
        {
          id: "bogus",
          severity: "high",
          title: "Unexpected DNS server 10.13.37.1",
          detail: "Local adapter config only; name was not queried.",
          resource: "10.13.37.1",
        },
        {
          id: "doh",
          severity: "low",
          title: "DNS over HTTPS unset",
          detail: "DoH is informational on workstation images.",
        },
      ]);
    case "audit-windows-roles":
      return pack(
        ctx,
        "Unexpected AD-DS / DNS / DHCP roles installed on the demo image.",
        { extra: { roles: demoWindowsRoles } },
        demoWindowsRoles
          .filter((r) => r.unexpected && r.installed)
          .map((r) => ({
            id: `role:${r.name}`,
            severity: "high" as const,
            title: `Unexpected role ${r.name}`,
            detail: "Workstation/member image usually should not host AD/DNS/DHCP. Do not demote another DC.",
            resource: r.name,
          })),
      );
    case "harden-null-session":
      return pack(
        ctx,
        mutateNote(ctx, "set RestrictAnonymous/SAM/NullSessAccess hardened values"),
        {
          extra: {
            before: demoNullSession,
            after: {
              RestrictAnonymous: 1,
              RestrictAnonymousSAM: 1,
              EveryoneIncludesAnonymous: 0,
              RestrictNullSessAccess: 1,
            },
            simulated: true,
            note: "SAM contents not dumped.",
          },
        },
        [
          {
            id: "null",
            severity: "high",
            title: "Anonymous SAM / null session unrestricted before harden",
            remediationOpId: "harden-null-session",
          },
        ],
      );
    case "blacklist-kernel-modules": {
      const usb = asBoolean(ctx.params.usbStorage, false);
      return pack(
        ctx,
        mutateNote(ctx, usb ? "blacklist uncommon modules including usb-storage" : "blacklist uncommon modules (usb-storage left loaded)"),
        { extra: { ...demoKernelModules, usbStorageBlacklisted: usb, simulated: true } },
        [
          {
            id: "dccp",
            severity: "medium",
            title: "Uncommon modules still loadable",
            detail: "dccp/sctp/cramfs/hfs not yet blacklisted.",
            remediationOpId: "blacklist-kernel-modules",
          },
        ],
      );
    }
    case "enforce-apparmor-profiles":
      return pack(
        ctx,
        mutateNote(ctx, "aa-enforce apache2 mysqld ntpd ping"),
        {
          extra: {
            enforced: ["apache2", "mysqld", "ntpd", "ping"],
            remainingComplain: 3,
            simulated: true,
          },
        },
      );
    case "enable-unattended-upgrades":
      return pack(
        ctx,
        mutateNote(ctx, "write 20auto-upgrades and enable unattended-upgrades"),
        {
          extra: {
            unattendedUpgrade: 1,
            updatePackageLists: 1,
            simulated: true,
          },
        },
      );
    case "audit-mail-services":
      return pack(ctx, "Postfix is an open relay; Dovecot allows plaintext auth.", { extra: demoMailServices }, [
        {
          id: "relay",
          severity: "critical",
          title: "Postfix mynetworks 0.0.0.0/0",
          detail: "Open relay. Local config only — mail was not sent.",
          remediationOpId: "disable-service",
        },
        {
          id: "vrfy",
          severity: "medium",
          title: "disable_vrfy_command=no",
          detail: "VRFY enumeration enabled.",
        },
      ]);
    case "audit-database-bind":
      return pack(ctx, "MySQL/Postgres listen on all interfaces with trust/skip-grant-tables.", { extra: demoDatabaseBind }, [
        {
          id: "bind",
          severity: "high",
          title: "mysqld bind-address=0.0.0.0",
          detail: "Database reachable on every interface. Passwords not printed.",
        },
        {
          id: "skip",
          severity: "critical",
          title: "skip-grant-tables set",
          detail: "Auth bypass knob in a systemd override. SQL was not queried.",
        },
        {
          id: "trust",
          severity: "high",
          title: "pg_hba host all all 0.0.0.0/0 trust",
          detail: "Postgres trust from anywhere.",
        },
      ]);
    case "audit-php-hardening":
      return pack(ctx, "PHP expose_php and allow_url_include are on; info.php present.", { extra: demoPhpHardening }, [
        {
          id: "expose",
          severity: "medium",
          title: "expose_php=On",
          detail: "X-Powered-By header leaks the PHP version.",
        },
        {
          id: "include",
          severity: "high",
          title: "allow_url_include=On",
          detail: "Remote include enabled. No exploit payload.",
        },
        {
          id: "info",
          severity: "medium",
          title: "info.php present",
          detail: "/var/www/html/info.php (contents not dumped).",
          resource: "/var/www/html/info.php",
        },
      ]);
    case "audit-snap-flatpak": {
      const bad = demoSnapFlatpak.filter((s) => s.suspicious);
      return pack(
        ctx,
        `${bad.length} unnecessary snap/flatpak apps flagged.`,
        { packages: bad.map((s) => ({ name: s.name, prohibited: true })), extra: { apps: demoSnapFlatpak } },
        bad.map((s) => ({
          id: `${s.kind}:${s.name}`,
          severity: /anydesk|steam/i.test(s.name) ? ("high" as const) : ("medium" as const),
          title: `${s.kind} ${s.name}`,
          detail: "Flagged for authorized removal. This op does not uninstall.",
          resource: s.name,
          remediationOpId: "remove-package",
        })),
      );
    }
    case "disable-ctrl-alt-del":
      return pack(
        ctx,
        mutateNote(ctx, "mask ctrl-alt-del.target and disable serial-getty@ttyS0"),
        { extra: { masked: ["ctrl-alt-del.target"], disabled: ["serial-getty@ttyS0"], simulated: true } },
      );
    case "audit-ipv6-privacy": {
      const disable = asBoolean(ctx.params.disableIPv6, false);
      return pack(
        ctx,
        disable
          ? mutateNote(ctx, "disable IPv6 via sysctl (optional path)")
          : "IPv6 privacy off; accept_ra and forwarding on (audit-only).",
        { extra: { ...demoIpv6, disableRequested: disable, applied: false } },
        [
          {
            id: "privacy",
            severity: "low",
            title: "IPv6 use_tempaddr=0",
            detail: "Privacy extensions off.",
          },
          {
            id: "ra",
            severity: "medium",
            title: "accept_ra=1 and forwarding=1",
            detail: "Router advertisements accepted on a forwarding host.",
            remediationOpId: "harden-sysctl",
          },
        ],
      );
    }
    case "audit-log-persistence":
      return pack(ctx, "journald is volatile; rsyslog is inactive.", { extra: demoLogPersistence }, [
        {
          id: "volatile",
          severity: "high",
          title: "journald Storage=volatile",
          detail: "/var/log/journal missing — logs will not persist across reboot.",
        },
        {
          id: "rsyslog",
          severity: "medium",
          title: "rsyslog inactive",
          detail: "File logging daemon not running.",
          remediationOpId: "audit-logging",
        },
      ]);
    case "audit-browser-policy":
      return pack(
        ctx,
        "Browser homepage and system proxy point at 10.13.37.1; leftover extension ids listed.",
        { extra: demoBrowserPolicy },
        [
          {
            id: "home",
            severity: "high",
            title: "Unexpected browser homepage",
            detail: demoBrowserPolicy.homepage,
          },
          {
            id: "proxy",
            severity: "high",
            title: "System proxy 10.13.37.1:8080",
            detail: "PAC/cookies/passwords not dumped.",
          },
        ],
      );
    case "harden-usb-storage": {
      const disable = asBoolean(ctx.params.disableUsbStorage, false);
      return pack(
        ctx,
        mutateNote(
          ctx,
          disable
            ? "disable autorun/execute and USB mass-storage"
            : "disable USB autorun/execute (mass-storage left enabled)",
        ),
        { extra: { ...demoUsbStorage, disableUsbStorage: disable, simulated: true } },
      );
    }
    case "audit-time-timezone":
      return pack(ctx, "Time sync is off; NTP 10.13.37.1; timezone Etc/GMT+12.", { extra: demoTimeTimezone }, [
        {
          id: "ntp",
          severity: "high",
          title: "NTP server 10.13.37.1",
          detail: "Unexpected time source. Not queried as an amplification test.",
          resource: "10.13.37.1",
          remediationOpId: "check-ntp",
        },
        {
          id: "tz",
          severity: "medium",
          title: "Timezone Etc/GMT+12",
          detail: "Unusual timezone for a US CP image.",
        },
      ]);
    case "export-coach-packet":
      return pack(
        ctx,
        "Redacted coach packet assembled (no hashes, no Wi-Fi keys, CCS not contacted).",
        {
          extra: {
            ...demoCoachPacket,
            outputDir: typeof ctx.params.outputDir === "string" ? ctx.params.outputDir : null,
          },
        },
      );
    default:
      return undefined;
  }
}
