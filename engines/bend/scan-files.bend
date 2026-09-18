# Parallel file-record scorer for CyberPatriot defensive scans.
# Input (CP_BEND_INVENTORY): one record per line, KIND|PATH|MODE
# KIND: W world-writable, S suid/sgid, M media, H hidden, B backdoor-ish name
# Authorized competition images only. Read-only. No exploits.

import Base

type Scored is Data:
  Scored{path: String, kind: String, mode: String, note: String, score: U32, keep: Bool}

def bool_json(b: Bool) -> String:
  match b:
    case False{}:
      "false"
    case True{}:
      "true"

def scored_json(h: Scored) -> String:
  Scored{+path, +kind, +mode, +note, +score, +keep} = h
  "{\"path\":\"" ++ path ++ "\",\"kind\":\"" ++ kind ++ "\",\"mode\":\"" ++ mode ++ "\",\"note\":\"" ++ note ++ "\",\"score\":" ++ U32.show(score) ++ ",\"keep\":" ++ bool_json(keep) ++ "}"

def encode.go(xs: List<&2, Scored>) -> String:
  match xs:
    case Nil{}:
      "]"
    case h <> t:
      "," ++ scored_json(h) ++ encode.go(t)

def encode(xs: List<&2, Scored>) -> String:
  match xs:
    case Nil{}:
      "{\"ok\":true,\"engine\":\"bend\",\"files\":[]}"
    case h <> t:
      "{\"ok\":true,\"engine\":\"bend\",\"files\":[" ++ scored_json(h) ++ encode.go(t) ++ "}"

def skip() -> Scored:
  Scored{"", "skip", "", "", 0, False{}}

def or3(a: Bool, b: Bool, c: Bool) -> Bool:
  Bool.or(a, Bool.or(b, c))

def or2(a: Bool, b: Bool) -> Bool:
  Bool.or(a, b)

def keep_at(min: U32, +score: U32) -> Bool:
  U32.is_ge(score, min)

def boost_tmp(+path: String) -> Bool:
  or2(String.contains(path, "/tmp/"), String.starts_with(path, "/tmp"))

def boost_home(+path: String) -> Bool:
  or2(String.contains(path, "/home/"), String.starts_with(path, "/home"))

def boost_varopt(+path: String) -> Bool:
  or2(String.contains(path, "/var/"), String.contains(path, "/opt/"))

def expected_suid(+path: String) -> Bool:
  or3(String.starts_with(path, "/usr/"), String.starts_with(path, "/bin/"), String.starts_with(path, "/sbin/"))

def critical_name(+path: String) -> Bool:
  or3(String.contains(path, "sudoers"), String.contains(path, "shadow"), String.contains(path, "cron"))

def w_score_home(home: Bool) -> U32 & String:
  match home:
    case True{}:
      (50, "home")
    case False{}:
      (35, "world-writable")

def w_score_loc(tmp: Bool, home: Bool) -> U32 & String:
  match tmp:
    case True{}:
      (60, "tmp")
    case False{}:
      w_score_home(home)

def w_score(crit: Bool, tmp: Bool, home: Bool) -> U32 & String:
  match crit:
    case True{}:
      (90, "critical-path")
    case False{}:
      w_score_loc(tmp, home)

def s_score_exp(expected: Bool) -> U32 & String:
  match expected:
    case True{}:
      (8, "expected-suid")
    case False{}:
      (70, "suid")

def s_score(unexpected: Bool, expected: Bool) -> U32 & String:
  match unexpected:
    case True{}:
      (95, "unexpected-suid")
    case False{}:
      s_score_exp(expected)

def apply_row(kind: String, path: String, mode: String, sk: U32 & String, min_keep: U32) -> Scored:
  (+score, note) = sk
  Scored{path, kind, mode, note, score, keep_at(min_keep, score)}

def score_w(+path: String, mode: String) -> Scored:
  apply_row(
    "world-writable",
    path,
    mode,
    w_score(critical_name(path), boost_tmp(path), boost_home(path)),
    20,
  )

def score_s(+path: String, mode: String) -> Scored:
  unexp = or3(boost_tmp(path), boost_home(path), boost_varopt(path))
  apply_row("suid", path, mode, s_score(unexp, expected_suid(path)), 20)

def score_m(path: String, mode: String) -> Scored:
  Scored{path, "media", mode, "media", 40, True{}}

def score_h(+path: String, mode: String) -> Scored:
  apply_row(
    "hidden",
    path,
    mode,
    w_score_loc(boost_tmp(path), boost_home(path)),
    20,
  )

def score_b(path: String, mode: String) -> Scored:
  Scored{path, "backdoor", mode, "suspicious-binary", 85, True{}}

def dispatch1(b: Bool, path: String, mode: String) -> Scored:
  match b:
    case True{}:
      score_b(path, mode)
    case False{}:
      skip()

def dispatch2(h: Bool, b: Bool, +path: String, mode: String) -> Scored:
  match h:
    case True{}:
      score_h(path, mode)
    case False{}:
      dispatch1(b, path, mode)

def dispatch3(m: Bool, h: Bool, b: Bool, +path: String, mode: String) -> Scored:
  match m:
    case True{}:
      score_m(path, mode)
    case False{}:
      dispatch2(h, b, path, mode)

def dispatch4(s: Bool, m: Bool, h: Bool, b: Bool, +path: String, mode: String) -> Scored:
  match s:
    case True{}:
      score_s(path, mode)
    case False{}:
      dispatch3(m, h, b, path, mode)

def dispatch5(w: Bool, s: Bool, m: Bool, h: Bool, b: Bool, +path: String, mode: String) -> Scored:
  match w:
    case True{}:
      score_w(path, mode)
    case False{}:
      dispatch4(s, m, h, b, path, mode)

def scored_for(+code: Char, +path: String, mode: String) -> Scored:
  dispatch5(
    Char.is_eq(code, 'W'),
    Char.is_eq(code, 'S'),
    Char.is_eq(code, 'M'),
    Char.is_eq(code, 'H'),
    Char.is_eq(code, 'B'),
    path,
    mode,
  )

def take_mode(+code: Char, +path: String, rest: List<&2, String>) -> Scored:
  match rest:
    case Nil{}:
      scored_for(code, path, "")
    case mode <> unused:
      scored_for(code, path, mode)

def take_path(+code: Char, fs: List<&2, String>) -> Scored:
  match fs:
    case Nil{}:
      skip()
    case path <> rest:
      take_mode(code, path, rest)

def classify_payload(code: Char, payload: String) -> Scored:
  take_path(code, String.split(payload, '|'))

def classify_rest(code: Char, rest: String) -> Scored:
  match rest:
    case SNil{}:
      skip()
    case SCon{sep, payload}:
      classify_payload(code, payload)

def classify(line: String) -> Scored:
  match line:
    case SNil{}:
      skip()
    case SCon{h, t}:
      classify_rest(h, t)

def seq_score(xs: List<&2, String>) -> List<&2, Scored>:
  match xs:
    case Nil{}:
      Nil{}
    case h <> t:
      classify(h) <> seq_score(t)

def cons_split(h: String, parts: List<&2, String> & List<&2, String>) -> List<&2, String> & List<&2, String>:
  (left, right) = parts
  (h <> left, right)

def split_at(n: Nat, xs: List<&2, String>) -> List<&2, String> & List<&2, String>:
  match n:
    case 0n:
      (Nil{}, xs)
    case 1n+p:
      match xs:
        case Nil{}:
          (Nil{}, Nil{})
        case h <> t:
          cons_split(h, split_at(p, t))

def join_scores(parts: List<&2, Scored> & List<&2, Scored>) -> List<&2, Scored>:
  (a, b) = parts
  List.append(&2, Scored, a, b)

def score_two(a: List<&2, String>, b: List<&2, String>) -> List<&2, Scored> & List<&2, Scored>:
  left right = seq_score(a) seq_score(b)
  (left, right)

def score_halves(halves: List<&2, String> & List<&2, String>) -> List<&2, Scored>:
  (left, right) = halves
  join_scores(score_two(left, right))

def par_score(+xs: List<&2, String>) -> List<&2, Scored>:
  +len = List.length(&2, String, xs)
  score_halves(split_at((len / 2n), xs))

def keep_hit(h: Scored) -> Bool:
  Scored{path, kind, mode, note, score, keep} = h
  keep

def finish_read(pair: File & Result<&1, &1, U32 & String, String>) -> IO(String):
  (fh2, text_res) = pair
  do IO<String>:
    File.close(fh2)
    IO.pass(String, text_res)

def emit(text: String) -> IO(Unit):
  lines = String.lines(text)
  scored = par_score(lines)
  kept = List.filter(~Scored, ~keep_hit, scored)
  IO.print(encode(kept))

def main() -> IO(Unit):
  do IO<Unit>:
    path : String <- IO.try(String, IO.get_env("CP_BEND_INVENTORY"))
    fh : File <- IO.try(File, File.open(path, "r"))
    pair : File & Result<&1, &1, U32 & String, String> <- File.read(fh, 2000000)
    text : String <- finish_read(pair)
    emit(text)
