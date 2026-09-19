# Parallel file-record scoring: SUID, world-writable, media, plants, RATs.
# Thin shell/Python collects path|mode|kind lines; Bend scores them in parallel.
import Base
import ./cp_lib.bend as Lib

def mode_ww(+mode: String) -> Bool:
  Bool.or(String.ends_with(mode, "2"), Bool.or(String.ends_with(mode, "3"), Bool.or(String.ends_with(mode, "6"), String.ends_with(mode, "7"))))

def is_suid(+mode: String) -> Bool:
  Bool.and(Nat.is_eq(String.length(mode), 4n), Bool.or(String.starts_with(mode, "4"), String.starts_with(mode, "6")))

def is_sgid(+mode: String) -> Bool:
  Bool.and(Nat.is_eq(String.length(mode), 4n), Bool.or(String.starts_with(mode, "2"), String.starts_with(mode, "6")))

def is_media(+path: String) -> Bool:
  Bool.or(String.ends_with(path, ".mp3"), Bool.or(String.ends_with(path, ".mp4"), Bool.or(String.ends_with(path, ".avi"), Bool.or(String.ends_with(path, ".mkv"), Bool.or(String.ends_with(path, ".mov"), Bool.or(String.ends_with(path, ".flac"), Bool.or(String.ends_with(path, ".wav"), String.ends_with(path, ".ogg"))))))))

def is_netcat(+path: String) -> Bool:
  Bool.or(String.ends_with(path, "/nc"), Bool.or(String.ends_with(path, "/ncat"), Bool.or(String.ends_with(path, "/netcat"), Bool.or(String.ends_with(path, "/socat"), Bool.or(String.ends_with(path, "nc.exe"), String.ends_with(path, "ncat.exe"))))))

def is_rat(+path: String) -> Bool:
  +p = String.to_lower(path)
  Bool.or(String.contains(p, "teamviewer"), Bool.or(String.contains(p, "anydesk"), Bool.or(String.contains(p, "rustdesk"), Bool.or(String.contains(p, "tightvnc"), Bool.or(String.contains(p, "realvnc"), Bool.or(String.contains(p, "ultravnc"), Bool.or(String.contains(p, "logmein"), Bool.or(String.contains(p, "splashtop"), Bool.or(String.contains(p, "chromoting"), Bool.or(String.contains(p, "anyconnect"), Bool.or(String.contains(p, "ultrasurf"), String.contains(p, "vncserver"))))))))))))

def is_sysprep(+path: String) -> Bool:
  +p = String.to_lower(path)
  Bool.or(String.contains(p, "unattend"), Bool.or(String.contains(p, "sysprep"), String.contains(p, "autounattend")))

def is_readme_kind(+kind: String) -> Bool:
  String.eq(kind, "readme")

def is_shell_backdoor(+kind: String) -> Bool:
  String.eq(kind, "shell-backdoor")

def is_shell_rc(+kind: String, +path: String) -> Bool:
  Bool.or(String.eq(kind, "shell"), Bool.or(String.eq(kind, "shell-backdoor"), Bool.or(String.contains(path, ".bashrc"), Bool.or(String.contains(path, ".profile"), String.contains(path, "profile.d")))))

def sticky_ok(+mode: String) -> Bool:
  Bool.and(Nat.is_eq(String.length(mode), 4n), String.starts_with(mode, "1"))

def is_temp_mount(+path: String) -> Bool:
  Bool.or(String.starts_with(path, "/tmp"), Bool.or(String.starts_with(path, "/var/tmp"), String.starts_with(path, "/dev/shm")))

def missing_sticky_go(ww: Bool, tmp: Bool, sticky: Bool) -> Bool:
  match sticky:
    case True{}:
      False{}
    case False{}:
      Bool.and(ww, tmp)

def missing_sticky(ww: Bool, tmp: Bool, +mode: String) -> Bool:
  missing_sticky_go(ww, tmp, sticky_ok(mode))

def score_path(+path: String, +mode: String, +kind: String) -> Lib.Hit:
  +tmp = String.starts_with(path, "/tmp")
  +home = String.starts_with(path, "/home")
  +varp = String.starts_with(path, "/var")
  +opt = String.starts_with(path, "/opt")
  +hidden = String.contains(path, "/.")
  +suid = is_suid(mode)
  +sgid = is_sgid(mode)
  +ww = mode_ww(mode)
  +shadow = String.contains(path, "shadow")
  +sudoers = String.contains(path, "sudoers")
  +cron = String.contains(path, "cron")
  +passwd = String.ends_with(path, "/passwd")
  +ssh = String.contains(path, "/ssh")
  +nc = is_netcat(path)
  +media = is_media(path)
  +rat = Bool.or(is_rat(path), String.eq(kind, "rat"))
  +plant = Bool.or(tmp, Bool.or(home, Bool.or(varp, opt)))
  +sensitive = Bool.or(shadow, Bool.or(sudoers, Bool.or(cron, passwd)))
  +score0 = {0n : Nat}
  +score1 = Lib.add_if(score0, suid, 20n)
  +score2 = Lib.add_if(score1, Bool.and(suid, plant), 30n)
  +score3 = Lib.add_if(score2, sgid, 8n)
  +score4 = Lib.add_if(score3, ww, 12n)
  +score5 = Lib.add_if(score4, Bool.and(ww, sensitive), 30n)
  +score6 = Lib.add_if(score5, media, 10n)
  +score7 = Lib.add_if(score6, hidden, 8n)
  +score8 = Lib.add_if(score7, nc, 25n)
  +score9 = Lib.add_if(score8, shadow, 35n)
  +scoreA = Lib.add_if(score9, rat, 28n)
  +scoreB = Lib.add_if(scoreA, Bool.and(ssh, ww), 20n)
  +sysprep = is_sysprep(path)
  +readme = is_readme_kind(kind)
  +nosticky = missing_sticky(ww, is_temp_mount(path), mode)
  +scoreC = Lib.add_if(scoreB, sysprep, 30n)
  +scoreD = Lib.add_if(scoreC, nosticky, 35n)
  +scoreE = Lib.add_if(scoreD, readme, 8n)
  +shellbd = is_shell_backdoor(kind)
  +shellrc = is_shell_rc(kind, path)
  +scoreF = Lib.add_if(scoreE, shellbd, 32n)
  +scoreG = Lib.add_if(scoreF, Bool.and(shellrc, Bool.not(shellbd)), 4n)
  +tags0 = {"" : String}
  +tags1 = Lib.tag_if(tags0, suid, "suid")
  +tags2 = Lib.tag_if(tags1, sgid, "sgid")
  +tags3 = Lib.tag_if(tags2, ww, "world-writable")
  +tags4 = Lib.tag_if(tags3, media, "media")
  +tags5 = Lib.tag_if(tags4, hidden, "hidden")
  +tags6 = Lib.tag_if(tags5, nc, "netcat-like")
  +tags7 = Lib.tag_if(tags6, plant, "plant-path")
  +tags8 = Lib.tag_if(tags7, rat, "remote-access")
  +tags9 = Lib.tag_if(tags8, shadow, "shadow")
  +tagsA = Lib.tag_if(tags9, sudoers, "sudoers")
  +tagsB = Lib.tag_if(tagsA, sysprep, "sysprep")
  +tagsC = Lib.tag_if(tagsB, nosticky, "missing-sticky")
  +tagsD = Lib.tag_if(tagsC, readme, "readme")
  +tagsE = Lib.tag_if(tagsD, shellbd, "shell-backdoor")
  +tagsF = Lib.tag_if(tagsE, shellrc, "shell-rc")
  Lib.Hit{path, Lib.sev_of(scoreG), tagsF, scoreG}

def score_line(line: String) -> Lib.Hit:
  +cols = String.split(line, '|')
  path = Lib.nth(cols, 0n)
  mode = Lib.nth(cols, 1n)
  kind = Lib.nth(cols, 2n)
  score_path(path, mode, kind)

# Parallel map: each record is independent; Bend fork-joins score_line with the tail.
def score_lines(xs: List<&2, String>) -> List<&2, Lib.Hit>:
  match xs:
    case Nil{}:
      Nil{}
    case +h <> t:
      a b = score_line(h) score_lines(t)
      a <> b

def main() -> IO(Unit):
  do IO<Unit>:
    text : String <- Lib.read_input()
    +hits : List<&2, Lib.Hit> = Lib.positive(score_lines(Lib.drop_empty(String.lines(text))))
    Lib.print_hits("files", hits)
