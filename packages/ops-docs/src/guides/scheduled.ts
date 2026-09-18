import type { HowToBody } from "../types.js";

export const SCHEDULED: Record<string, HowToBody> = {
  "audit-cron": {
    summary: "Inventory crontabs and flag wget|sh, /tmp payloads, and world-writable cron files.",
    what: "Reads /etc/crontab, cron.d, cron.*, and user crontabs. Flags nc/wget|sh, curl-to-pipe, /tmp executables, and world-writable cron files.",
    whyItScores:
      "Cron is the usual persistence for planted bash in /tmp. World-writable cron.d is a finding even before you read the command.",
    whenToRun: "Linux persistence pass with audit-at-jobs, audit-startup-items, and find-hidden-executables.",
    steps: [
      "Run the op. Snapshot suspicious command lines into forensics notes.",
      "Remove planted cron files/lines on the image; chmod world-writable cron dirs.",
      "Delete or disable the payload they called (see find-hidden-executables).",
      "Re-run until only system/README jobs remain.",
    ],
    goodLooksLike: [
      "No wget|sh or /tmp/suid_bash jobs.",
      "cron.d files not world-writable.",
      "Authorized backup/logrotate jobs still present.",
    ],
    risks: [
      "Read-only. Do not run the cron command ‘to see what it does.’",
      "Deleting distro logrotate/cron can break logging — only remove plants.",
    ],
    related: ["audit-at-jobs", "find-hidden-executables", "find-world-writable", "audit-startup-items"],
    keywords: ["crontab", "wget | sh", "cron.d/hack", "world-writable cron"],
  },
  "audit-at-jobs": {
    summary: "List at/batch jobs — unexpected ones are a common plant.",
    what: "Lists at/batch jobs. Reports the command; does not execute it.",
    whyItScores: "at is easier to miss than cron. A zygote python job is a typical plant.",
    whenToRun: "Right after audit-cron on Linux.",
    steps: [
      "Run the op. If empty, good.",
      "Unexpected jobs: copy the command into notes, then atrm on the image.",
      "Investigate the user who queued it (flag-suspicious-users).",
    ],
    goodLooksLike: ["No unexpected at jobs.", "Remaining jobs are README-justified."],
    risks: [
      "Read-only. The reverse-looking command is reported, not executed.",
      "Do not ‘test’ the job.",
    ],
    related: ["audit-cron", "flag-suspicious-users", "find-backdoor-binaries", "list-scheduled-tasks"],
    keywords: ["atq", "atrm", "batch", "at job"],
  },
  "list-scheduled-tasks": {
    summary: "Non-Microsoft scheduled tasks with TEMP/Startup payloads.",
    what: "Lists non-Microsoft scheduled tasks. Highlights user-writable actions, missing authors, and payloads under TEMP or Startup.",
    whyItScores: "Windows persistence often lives in Task Scheduler as ‘Updater’ running %TEMP%\\svc.exe.",
    whenToRun: "Windows persistence pass with audit-startup-items.",
    steps: [
      "Run the op. Ignore signed Microsoft tasks unless the action looks hijacked.",
      "Disable/delete planted tasks on the image; remove the payload file after snapshotting.",
      "Re-run and check Startup folders via audit-startup-items.",
    ],
    goodLooksLike: [
      "No user tasks pointing at TEMP or Startup binaries.",
      "Remaining third-party tasks are README software.",
    ],
    risks: [
      "Read-only.",
      "Disabling a required vendor updater can be wrong — README/software list first.",
    ],
    related: ["audit-startup-items", "find-hidden-executables", "find-backdoor-binaries", "audit-cron"],
    keywords: ["schtasks", "%TEMP%", "Updater", "Startup folder"],
  },
  "audit-sysctl": {
    summary: "Read workstation sysctl hardening knobs (forwarding, syncookies, redirects).",
    what: "Reads ip_forward, rp_filter, accept_redirects, tcp_syncookies, dmesg_restrict, kptr_restrict, randomize_va_space. Forwarding on a workstation is a finding.",
    whyItScores: "ip_forward=1 and tcp_syncookies=0 are common kernel plants on Linux workstations.",
    whenToRun: "Linux kernel pass, before harden-sysctl.",
    steps: [
      "Run the op. Workstations should not forward; routers might — believe the README.",
      "Apply harden-sysctl for the conservative workstation set.",
      "Re-run the audit.",
    ],
    goodLooksLike: [
      "ip_forward=0 on a workstation (unless the README says router).",
      "tcp_syncookies=1, redirects off, rp_filter on.",
    ],
    risks: [
      "Read-only.",
      "If the README says this image is a router, do not blindly disable forwarding.",
    ],
    related: ["harden-sysctl", "audit-firewall", "enable-firewall"],
    keywords: ["ip_forward", "tcp_syncookies", "accept_redirects", "rp_filter"],
  },
  "harden-sysctl": {
    summary: "Write a conservative sysctl drop-in and apply it.",
    what: "Writes /etc/sysctl.d/99-cp-hardening.conf (no forwarding, syncookies, rp_filter, no redirects) and runs sysctl --system.",
    whyItScores: "This is the mutate that closes audit-sysctl findings on a workstation image.",
    whenToRun: "After audit-sysctl, when the README does not require routing/forwarding.",
    steps: [
      "Confirm the image is not a router per README.",
      "dryRun:true, then live confirm:true.",
      "Re-run audit-sysctl.",
    ],
    goodLooksLike: [
      "Drop-in present.",
      "ip_forward=0, syncookies=1, redirects=0.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Disabling forwarding on a required router image will cost points.",
    ],
    related: ["audit-sysctl", "enable-firewall", "apply-default-deny-inbound"],
    keywords: ["sysctl.d", "99-cp-hardening.conf", "confirm"],
  },
  "audit-startup-items": {
    summary: "Enabled units, rc.local, Run keys, and Startup folder payloads.",
    what: "Lists systemd enabled units, rc.local, Windows Run keys, and Startup folder entries. Flags unsigned or temp-path payloads.",
    whyItScores: "rc.local calling /tmp/.kworker or HKCU Run \\update.exe is persistence the service list can miss.",
    whenToRun: "Persistence pass on both platforms, with cron/tasks and hidden executables.",
    steps: [
      "Run the op. Keep required services (sshd) in the enabled list.",
      "Remove planted rc.local lines, Run keys, and Startup shortcuts on the image.",
      "Delete the payload files after snapshotting.",
    ],
    goodLooksLike: [
      "sshd/required units still enabled.",
      "No /tmp payloads in rc.local or Run keys.",
    ],
    risks: [
      "Read-only.",
      "Disabling a required enabled unit here (by later mutate) costs points — README.",
    ],
    related: [
      "audit-cron",
      "list-scheduled-tasks",
      "find-hidden-executables",
      "list-services",
      "audit-persistence-deep",
    ],
    keywords: ["rc.local", "HKCU Run", "LaunchAgents", "enabled units"],
  },
  "audit-persistence-deep": {
    summary: "Deeper persistence: systemd, rc.local, cron, profile.d, Run keys, Startup, tasks.",
    what: "Goes beyond audit-startup-items: systemd enabled units, rc.local, cron/cron.d, /etc/profile.d, user autostart, Windows Run/RunOnce, Startup folder, and non-Microsoft scheduled tasks. Flags temp-path payloads, wget|sh, and interpreter plants. Inventory only.",
    whyItScores:
      "Plants hide in profile.d and RunOnce after you cleaned rc.local. One pass over every autostart class is faster than four separate eyeballs.",
    whenToRun: "Persistence pass on both platforms, after the first startup/cron sweep, and again near the end.",
    steps: [
      "Run the op. Keep required units (sshd) enabled.",
      "Snapshot suspicious rc.local / cron / profile.d / Run / Startup payloads into team notes.",
      "Remove the planted lines/tasks on the image, then delete the payload files if forensics does not need them.",
      "Re-run plus audit-cron and find-hidden-executables so the plant does not return.",
    ],
    goodLooksLike: [
      "No /tmp payloads in rc.local, cron, profile.d, or Run keys.",
      "No wget|sh or interpreter plants.",
      "Required services still enabled.",
    ],
    risks: [
      "Read-only inventory. Do not execute the payload ‘to confirm.’",
      "Disabling a required enabled unit later costs points — README.",
    ],
    related: [
      "audit-startup-items",
      "audit-cron",
      "list-scheduled-tasks",
      "find-hidden-executables",
    ],
    keywords: ["profile.d", "RunOnce", "wget|sh", "rc.local", "autostart"],
  },
};
