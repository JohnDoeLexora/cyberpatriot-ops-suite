# Parallel remaining-work scorer for CyberPatriot heuristic packs.
# Input (CP_BEND_INVENTORY): KIND|RESOURCE|BASE|FLAGS
# KIND: U user, P port, F file, S service
# FLAGS letters: E empty-password, N never-expires, A extra-admin, T tmp-path, C critical-port, R risky-service
# Authorized competition images only. Heuristic, not the official CCS score.

import Base

type Hit is Data:
  Hit{kind: String, resource: String, score: U32, keep: Bool}

def bool_json(b: Bool) -> String:
  match b:
    case False{}:
      "false"
    case True{}:
      "true"

def hit_json(h: Hit) -> String:
  Hit{+kind, +resource, +score, +keep} = h
  "{\"kind\":\"" ++ kind ++ "\",\"resource\":\"" ++ resource ++ "\",\"score\":" ++ U32.show(score) ++ ",\"keep\":" ++ bool_json(keep) ++ "}"

def encode.go(xs: List<&2, Hit>) -> String:
  match xs:
    case Nil{}:
      "]"
    case h <> t:
      "," ++ hit_json(h) ++ encode.go(t)

def encode_files(xs: List<&2, Hit>) -> String:
  match xs:
    case Nil{}:
      "[]"
    case h <> t:
      "[" ++ hit_json(h) ++ encode.go(t)

def skip() -> Hit:
  Hit{"skip", "", 0, False{}}

def cap_if(over: Bool, n: U32) -> U32:
  match over:
    case True{}:
      100
    case False{}:
      n

def cap100(+n: U32) -> U32:
  cap_if(U32.is_gt(n, 100), n)

def add_flag(present: Bool, bonus: U32, acc: U32) -> U32:
  match present:
    case False{}:
      acc
    case True{}:
      (acc + bonus : U32)

def from_maybe_u32(m: Maybe<&2, U32>) -> U32:
  match m:
    case None{}:
      0
    case Some{n}:
      n

def parse_base(s: String) -> U32:
  from_maybe_u32(U32.read(s))

def kind_name_f(f: Bool) -> String:
  match f:
    case True{}:
      "file"
    case False{}:
      "service"

def kind_name_pf(p: Bool, f: Bool) -> String:
  match p:
    case True{}:
      "port"
    case False{}:
      kind_name_f(f)

def kind_name(u: Bool, p: Bool, f: Bool) -> String:
  match u:
    case True{}:
      "user"
    case False{}:
      kind_name_pf(p, f)

def boost_flags(+flags: String, acc: U32) -> U32:
  a = add_flag(String.contains(flags, "E"), 35, acc)
  b = add_flag(String.contains(flags, "N"), 15, a)
  c = add_flag(String.contains(flags, "A"), 20, b)
  d = add_flag(String.contains(flags, "T"), 15, c)
  e = add_flag(String.contains(flags, "C"), 25, d)
  add_flag(String.contains(flags, "R"), 20, e)

def keep_at(min: U32, +score: U32) -> Bool:
  U32.is_ge(score, min)

def finish_hit(+code: Char, resource: String, base: String, flags: String) -> Hit:
  u = Char.is_eq(code, 'U')
  p = Char.is_eq(code, 'P')
  f = Char.is_eq(code, 'F')
  kind = kind_name(u, p, f)
  raw = boost_flags(flags, parse_base(base))
  +score = cap100(raw)
  Hit{kind, resource, score, keep_at(10, score)}

def take_flags(+code: Char, resource: String, base: String, rest: List<&2, String>) -> Hit:
  match rest:
    case Nil{}:
      finish_hit(code, resource, base, "")
    case flags <> unused:
      finish_hit(code, resource, base, flags)

def take_base(+code: Char, resource: String, rest: List<&2, String>) -> Hit:
  match rest:
    case Nil{}:
      finish_hit(code, resource, "0", "")
    case base <> more:
      take_flags(code, resource, base, more)

def take_resource(+code: Char, fs: List<&2, String>) -> Hit:
  match fs:
    case Nil{}:
      skip()
    case resource <> rest:
      take_base(code, resource, rest)

def classify_payload(code: Char, payload: String) -> Hit:
  take_resource(code, String.split(payload, '|'))

def classify_rest(code: Char, rest: String) -> Hit:
  match rest:
    case SNil{}:
      skip()
    case SCon{sep, payload}:
      classify_payload(code, payload)

def classify(line: String) -> Hit:
  match line:
    case SNil{}:
      skip()
    case SCon{h, t}:
      classify_rest(h, t)

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
  Hit{kind, resource, score, keep} = h
  keep

def add_hit(h: Hit, acc: U32) -> U32:
  Hit{kind, resource, +score, keep} = h
  cap100((score + acc : U32))

def sum_hits(xs: List<&2, Hit>) -> U32:
  match xs:
    case Nil{}:
      0
    case h <> t:
      add_hit(h, sum_hits(t))

def wrap(total: U32, xs: List<&2, Hit>) -> String:
  "{\"ok\":true,\"engine\":\"bend\",\"remainingWork\":" ++ U32.show(total) ++ ",\"findings\":" ++ encode_files(xs) ++ "}"

def finish_read(pair: File & Result<&1, &1, U32 & String, String>) -> IO(String):
  (fh2, text_res) = pair
  do IO<String>:
    File.close(fh2)
    IO.pass(String, text_res)

def emit(text: String) -> IO(Unit):
  lines = String.lines(text)
  scored = par_score(lines)
  +kept = List.filter(~Hit, ~keep_hit, scored)
  total = sum_hits(kept)
  IO.print(wrap(total, kept))

def main() -> IO(Unit):
  do IO<Unit>:
    path : String <- IO.try(String, IO.get_env("CP_BEND_INVENTORY"))
    fh : File <- IO.try(File, File.open(path, "r"))
    pair : File & Result<&1, &1, U32 & String, String> <- File.read(fh, 2000000)
    text : String <- finish_read(pair)
    emit(text)
