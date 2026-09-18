# Parallel heuristic scoring for local accounts.
# Collector emits name|uid|home|shell|empty|locked|neverlogin|admin|allow|interactive
# (no password hashes). Bend scores each row independently.
import Base
import ./cp_lib.bend as Lib

def flag1(s: String) -> Bool:
  String.eq(s, "1")

def name_bad(+n: String) -> Bool:
  +p = String.to_lower(n)
  Bool.or(String.contains(p, "hacker"), Bool.or(String.contains(p, "toor"), Bool.or(String.contains(p, "flag"), Bool.or(String.contains(p, "pwn"), Bool.or(String.contains(p, "backdoor"), Bool.or(String.contains(p, "n00b"), Bool.or(String.contains(p, "1337"), Bool.or(String.contains(p, "sploit"), Bool.or(String.eq(p, "guest"), String.contains(p, "rooty"))))))))))

def odd_shell(+shell: String) -> Bool:
  Bool.or(String.contains(shell, "python"), Bool.or(String.contains(shell, "/tmp"), Bool.or(String.contains(shell, "perl"), String.contains(shell, "ruby"))))

def odd_home(+home: String, +name: String) -> Bool:
  in_home = Bool.or(String.starts_with(home, "/home/"), Bool.or(String.eq(home, "/root"), String.contains(home, "Users")))
  Bool.not(in_home)

def score_user(+name: String, +uid: String, +home: String, +shell: String, +empty: Bool, neverlogin: Bool, admin: Bool, +allow: Bool, +interactive: Bool) -> Lib.Hit:
  +uid0 = Bool.and(String.eq(uid, "0"), Bool.not(String.eq(name, "root")))
  +weird_uid = Bool.or(String.eq(uid, "666"), String.eq(uid, "1337"))
  +bad_name = name_bad(name)
  +bad_shell = odd_shell(shell)
  +bad_home = Bool.and(interactive, odd_home(home, name))
  +extra_admin = Bool.and(admin, Bool.not(allow))
  +missing = Bool.and(interactive, Bool.not(allow))
  +never = Bool.and(interactive, neverlogin)
  +score0 = {0n : Nat}
  +score1 = Lib.add_if(score0, uid0, 40n)
  +score2 = Lib.add_if(score1, empty, 35n)
  +score3 = Lib.add_if(score2, missing, 25n)
  +score4 = Lib.add_if(score3, bad_name, 20n)
  +score5 = Lib.add_if(score4, extra_admin, 20n)
  +score6 = Lib.add_if(score5, bad_home, 15n)
  +score7 = Lib.add_if(score6, bad_shell, 15n)
  +score8 = Lib.add_if(score7, weird_uid, 16n)
  +score9 = Lib.add_if(score8, never, 10n)
  +tags0 = {"" : String}
  +tags1 = Lib.tag_if(tags0, uid0, "uid-weirdness")
  +tags2 = Lib.tag_if(tags1, weird_uid, "uid-weirdness")
  +tags3 = Lib.tag_if(tags2, empty, "empty-password")
  +tags4 = Lib.tag_if(tags3, missing, "not-in-allowlist")
  +tags5 = Lib.tag_if(tags4, bad_name, "name-pattern")
  +tags6 = Lib.tag_if(tags5, extra_admin, "extra-admin")
  +tags7 = Lib.tag_if(tags6, bad_home, "home-outside-home")
  +tags8 = Lib.tag_if(tags7, bad_shell, "nonstandard-shell")
  +tags9 = Lib.tag_if(tags8, never, "never-logged-in")
  Lib.Hit{name, Lib.sev_of(score9), tags9, score9}

def score_line(line: String) -> Lib.Hit:
  +cols = String.split(line, '|')
  name = Lib.nth(cols, 0n)
  uid = Lib.nth(cols, 1n)
  home = Lib.nth(cols, 2n)
  shell = Lib.nth(cols, 3n)
  empty = flag1(Lib.nth(cols, 4n))
  neverlogin = flag1(Lib.nth(cols, 6n))
  admin = flag1(Lib.nth(cols, 7n))
  allow = flag1(Lib.nth(cols, 8n))
  interactive = flag1(Lib.nth(cols, 9n))
  score_user(name, uid, home, shell, empty, neverlogin, admin, allow, interactive)

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
    Lib.print_hits("users", hits)
