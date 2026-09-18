import type { HowToBody } from "../types.js";

export const WINDOWS: Record<string, HowToBody> = {
  "disable-smbv1": {
    summary: "Turn off the SMBv1 feature/registry on a Windows image.",
    what: "Disables SMB1Protocol (optional feature / registry). Standard in-scope Windows hardening.",
    whyItScores: "SMBv1 is a high Windows finding even when SMB itself is required.",
    whenToRun: "After audit-smb, whether or not file sharing stays on.",
    steps: [
      "Run audit-smb so you know SMBv1 is actually on.",
      "dryRun:true, then live confirm:true.",
      "Re-run audit-smb. SMBv2/3 can remain if shares are required.",
    ],
    goodLooksLike: ["SMB1Protocol disabled.", "Guest shares still handled separately via audit-shared-folders."],
    risks: [
      "Mutation. Live requires confirm:true.",
      "If a dinosaur README required SMBv1 (almost never), stop. Otherwise disable it.",
    ],
    related: ["audit-smb", "audit-shared-folders", "enable-firewall", "disable-autoplay"],
    keywords: ["SMB1Protocol", "Disable-WindowsOptionalFeature", "confirm"],
  },
  "enable-windows-defender": {
    summary: "Turn realtime Defender back on if it was disabled.",
    what: "Re-enables Defender realtime monitoring. Does not download third-party AV.",
    whyItScores: "Defender disabled is a common registry/policy plant. Scoring wants the built-in AV on.",
    whenToRun: "Windows pass with disable-autoplay and audit-hosts-file (so signatures can update).",
    steps: [
      "Run the op with dryRun:true if you only need the intended Set-MpPreference.",
      "Live confirm:true.",
      "If hosts file sinkholed Defender, fix that first (audit-hosts-file).",
    ],
    goodLooksLike: [
      "Realtime monitoring on.",
      "No third-party random AV installer involved.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Do not sideload cracked AV. Do not disable Defender to ‘go faster.’",
    ],
    related: ["audit-hosts-file", "check-pending-updates", "disable-autoplay", "audit-uac"],
    keywords: ["Defender", "DisableRealtimeMonitoring", "Set-MpPreference", "confirm"],
  },
  "audit-powershell-logging": {
    summary: "Check Module Logging, Script Block Logging, and Transcription.",
    what: "Reads PowerShell logging policy. Enabling these is kosher evidence collection on the local image.",
    whyItScores: "ScriptBlockLogging off is a Windows logging finding and hurts your own forensics notes.",
    whenToRun: "Windows logging pass with audit-logging.",
    steps: [
      "Run the op. Note which of the three are off.",
      "Enable them via local policy/registry on the image (this op is read-only).",
      "Re-run. Transcription path should be a local directory, not a remote share you do not control.",
    ],
    goodLooksLike: [
      "Script Block Logging on.",
      "Module Logging on.",
      "Transcription on to a local path if the README/policy expects it.",
    ],
    risks: [
      "Read-only here.",
      "Do not ship transcripts off-image. This is not unconstrained attack scripting.",
    ],
    related: ["audit-logging", "export-evidence-bundle", "enable-windows-defender"],
    keywords: ["ScriptBlockLogging", "Transcription", "Module Logging"],
  },
  "disable-autoplay": {
    summary: "Disable Autoplay/Autorun via NoDriveTypeAutoRun.",
    what: "Sets NoDriveTypeAutoRun (0xFF). Standard CP Windows hardening against removable-media autorun.",
    whyItScores: "Autoplay is a checkbox Windows item and a persistence path for planted USB-style payloads.",
    whenToRun: "Windows hardening pass with enable-windows-defender and disable-smbv1.",
    steps: [
      "dryRun:true to see the registry value that would be set.",
      "Live confirm:true.",
      "Re-check with your registry checklist / this op’s demo output.",
    ],
    goodLooksLike: [
      "NoDriveTypeAutoRun=0xFF (or equivalent ‘no autorun’ policy).",
      "Removable media does not auto-launch an installer.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Local image registry only.",
    ],
    related: ["enable-windows-defender", "disable-smbv1", "audit-uac", "audit-startup-items"],
    keywords: ["NoDriveTypeAutoRun", "autorun", "autoplay", "confirm"],
  },
  "check-bitlocker-status": {
    summary: "Report BitLocker on/off per volume — informational, no recovery keys.",
    what: "Protection status per volume. CP scoring may or may not require encryption. Does not export recovery keys.",
    whyItScores:
      "Some Windows images score encryption; others only want you to know the state. Either way, dumping recovery keys is out of scope and dangerous.",
    whenToRun: "Windows extras, after the high-value user/firewall work.",
    steps: [
      "Run the op. Note Protection Off vs On.",
      "If the README requires BitLocker and it is off, follow the README’s encrypt procedure on the authorized image — this op will not turn it on.",
      "Never copy recovery keys into chat, Git, or evidence zips.",
    ],
    goodLooksLike: [
      "Status matches the README requirement.",
      "No recovery key material in the result.",
    ],
    risks: [
      "Read-only.",
      "Do not export or print recovery keys. Do not encrypt blindly if the README is silent and time is short.",
    ],
    related: ["enable-windows-defender", "audit-uac", "export-evidence-bundle"],
    keywords: ["BitLocker", "Protection Off", "recovery key"],
  },
};
