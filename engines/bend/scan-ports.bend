# Parallel listener scoring for CyberPatriot (local ss/netstat inventory only).
# Input (CP_BEND_INVENTORY): PORT|ADDR|PROCESS
# Does not scan other hosts.

import Base

type Hit is Data:
  Hit{port: String, address: String, process: String, score: U32, keep: Bool}

def bool_json(b: Bool) -> String:
  match b:
    case False{}:
      "false"
    case True{}:
      "true"

def hit_json(h: Hit) -> String:
  Hit{+port, +address, +process, +score, +keep} = h
  "{\"port\":\"" ++ port ++ "\",\"address\":\"" ++ address ++ "\",\"process\":\"" ++ process ++ "\",\"score\":" ++ U32.show(score) ++ ",\"suspicious\":" ++ bool_json(keep) ++ "}"

def encode.go(xs: List<&2, Hit>) -> String:
  match xs:
    case Nil{}:
      "]"
    case h <> t:
      "," ++ hit_json(h) ++ encode.go(t)

def encode(xs: List<&2, Hit>) -> String:
  match xs:
    case Nil{}:
      "{\"ok\":true,\"engine\":\"bend\",\"ports\":[]}"
    case h <> t:
      "{\"ok\":true,\"engine\":\"bend\",\"ports\":[" ++ hit_json(h) ++ encode.go(t) ++ "}"

def skip() -> Hit:
  Hit{"", "", "", 0, False{}}

def eq_or(a: Bool, b: String, target: String) -> Bool:
  match a:
    case True{}:
      True{}
    case False{}:
      String.eq(b, target)

def crit_port(+p: String) -> Bool:
  a = eq_or(False{}, p, "31337")
  b = eq_or(a, p, "4444")
  eq_or(b, p, "23")

def high_port(+p: String) -> Bool:
  a = eq_or(False{}, p, "21")
  b = eq_or(a, p, "69")
  c = eq_or(b, p, "111")
  d = eq_or(c, p, "135")
  e = eq_or(d, p, "139")
  f = eq_or(e, p, "445")
  g = eq_or(f, p, "512")
  h = eq_or(g, p, "513")
  i = eq_or(h, p, "514")
  j = eq_or(i, p, "3389")
  eq_or(j, p, "5900")

def score_high(high: Bool) -> U32:
  match high:
    case True{}:
      70
    case False{}:
      5

def score_port(crit: Bool, high: Bool) -> U32:
  match crit:
    case True{}:
      90
    case False{}:
      score_high(high)

def keep_at(min: U32, +score: U32) -> Bool:
  U32.is_ge(score, min)

def finish(+port: String, address: String, process: String) -> Hit:
  +score = score_port(crit_port(port), high_port(port))
  Hit{port, address, process, score, keep_at(20, score)}

def take_proc(+port: String, address: String, rest: List<&2, String>) -> Hit:
  match rest:
    case Nil{}:
      finish(port, address, "")
    case proc <> unused:
      finish(port, address, proc)

def take_addr(+port: String, fs: List<&2, String>) -> Hit:
  match fs:
    case Nil{}:
      finish(port, "", "")
    case address <> rest:
      take_proc(port, address, rest)

def classify_fields(fs: List<&2, String>) -> Hit:
  match fs:
    case Nil{}:
      skip()
    case port <> rest:
      take_addr(port, rest)

def classify_ok(empty: Bool, line: String) -> Hit:
  match empty:
    case True{}:
      skip()
    case False{}:
      classify_fields(String.split(line, '|'))

def classify(+line: String) -> Hit:
  classify_ok(String.is_empty(line), line)

def seq_score(xs: List<&2, String>) -> List<&2, Hit>:
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

def join_hits(parts: List<&2, Hit> & List<&2, Hit>) -> List<&2, Hit>:
  (a, b) = parts
  List.append(&2, Hit, a, b)

def score_two(a: List<&2, String>, b: List<&2, String>) -> List<&2, Hit> & List<&2, Hit>:
  left right = seq_score(a) seq_score(b)
  (left, right)

def score_halves(halves: List<&2, String> & List<&2, String>) -> List<&2, Hit>:
  (left, right) = halves
  join_hits(score_two(left, right))

def par_score(+xs: List<&2, String>) -> List<&2, Hit>:
  +len = List.length(&2, String, xs)
  score_halves(split_at((len / 2n), xs))

def keep_hit(h: Hit) -> Bool:
  Hit{port, address, process, score, keep} = h
  keep

def finish_read(pair: File & Result<&1, &1, U32 & String, String>) -> IO(String):
  (fh2, text_res) = pair
  do IO<String>:
    File.close(fh2)
    IO.pass(String, text_res)

def emit(text: String) -> IO(Unit):
  lines = String.lines(text)
  scored = par_score(lines)
  kept = List.filter(~Hit, ~keep_hit, scored)
  IO.print(encode(kept))

def main() -> IO(Unit):
  do IO<Unit>:
    path : String <- IO.try(String, IO.get_env("CP_BEND_INVENTORY"))
    fh : File <- IO.try(File, File.open(path, "r"))
    pair : File & Result<&1, &1, U32 & String, String> <- File.read(fh, 2000000)
    text : String <- finish_read(pair)
    emit(text)
