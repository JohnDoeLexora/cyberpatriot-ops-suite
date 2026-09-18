# Shared Bend 2 helpers for CyberPatriot defensive parallel scoring.
# Authorized competition images only. No exploits, no hash dumps.
import Base

type Hit is Data:
  Hit{path: String, sev: String, tags: String, score: Nat}

def from_maybe(m: Maybe<&2, String>) -> String:
  match m:
    case None{}:
      ""
    case Some{v}:
      v

def nth(xs: List<&2, String>, n: Nat) -> String:
  from_maybe(List.get(&2, String, xs, n))

def esc_char(+h: Char, rest: String, quote: Bool) -> String:
  match quote:
    case True{}:
      "\\\"" ++ rest
    case False{}:
      SCon{h, rest}

def json_escape(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{+h, t}:
      esc_char(h, json_escape(t), Char.is_eq(h, '"'))

def hit_json(h: Hit) -> String:
  match h:
    case Hit{+path, +sev, +tags, +score}:
      "{\"path\":\"" ++ json_escape(path) ++ "\",\"severity\":\"" ++ sev ++ "\",\"tags\":\"" ++ tags ++ "\",\"score\":" ++ Nat.show(score) ++ "}"

def hits_json(xs: List<&2, Hit>) -> String:
  match xs:
    case Nil{}:
      ""
    case Con{+h, Nil{}}:
      hit_json(h)
    case Con{+h, t}:
      hit_json(h) ++ "," ++ hits_json(t)

def sum_hits(xs: List<&2, Hit>) -> Nat:
  match xs:
    case Nil{}:
      0n
    case Con{Hit{_, _, _, score}, t}:
      Nat.add(score, sum_hits(t))

def sev_ge10(+n: Nat, ge10: Bool) -> String:
  match ge10:
    case True{}:
      "medium"
    case False{}:
      "low"

def sev_ge25(+n: Nat, ge25: Bool) -> String:
  match ge25:
    case True{}:
      "high"
    case False{}:
      sev_ge10(n, Nat.is_ge(n, 10n))

def sev_ge40(+n: Nat, ge40: Bool) -> String:
  match ge40:
    case True{}:
      "critical"
    case False{}:
      sev_ge25(n, Nat.is_ge(n, 25n))

def sev_of(+n: Nat) -> String:
  sev_ge40(n, Nat.is_ge(n, 40n))

def add_if(acc: Nat, hit: Bool, n: Nat) -> Nat:
  match hit:
    case True{}:
      Nat.add(acc, n)
    case False{}:
      acc

def tag_join(+acc: String, +tag: String, empty: Bool) -> String:
  match empty:
    case True{}:
      tag
    case False{}:
      acc ++ "," ++ tag

def tag_if(+acc: String, hit: Bool, +tag: String) -> String:
  match hit:
    case False{}:
      acc
    case True{}:
      tag_join(acc, tag, String.is_empty(acc))

def keep_nonempty(+h: String, rest: List<&2, String>, empty: Bool) -> List<&2, String>:
  match empty:
    case True{}:
      rest
    case False{}:
      h <> rest

def drop_empty(xs: List<&2, String>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case +h <> t:
      keep_nonempty(h, drop_empty(t), String.is_empty(h))

def keep_hit(+h: Hit, rest: List<&2, Hit>, keep: Bool) -> List<&2, Hit>:
  match keep:
    case True{}:
      h <> rest
    case False{}:
      rest

def hit_positive(h: Hit) -> Bool:
  match h:
    case Hit{_, _, _, score}:
      Nat.is_gt(score, 0n)

def positive(xs: List<&2, Hit>) -> List<&2, Hit>:
  match xs:
    case Nil{}:
      Nil{}
    case +h <> t:
      keep_hit(h, positive(t), hit_positive(h))

def wrap(+kind: String, +hits: List<&2, Hit>) -> String:
  n = List.length(&2, Hit, hits)
  total = sum_hits(hits)
  "{\"ok\":true,\"engine\":\"bend\",\"kind\":\"" ++ kind ++ "\",\"count\":" ++ Nat.show(n) ++ ",\"totalScore\":" ++ Nat.show(total) ++ ",\"findings\":[" ++ hits_json(hits) ++ "]}"

def print_hits(+kind: String, +hits: List<&2, Hit>) -> IO(Unit):
  IO.print(wrap(kind, hits))

def finish_read(fh: File, res: Result<&1, &1, U32 & String, String>) -> IO(String):
  do IO<String>:
    File.close(fh)
    text : String <- IO.pass(String, res)
    return text

def take_text(pair: File & Result<&1, &1, U32 & String, String>) -> IO(String):
  (fh, res) = pair
  finish_read(fh, res)

def read_input() -> IO(String):
  do IO<String>:
    path : String <- IO.try(String, IO.get_env("CP_BEND_INPUT"))
    file : File <- IO.try(File, File.open(path, "r"))
    pair : File & Result<&1, &1, U32 & String, String> <- File.read(file, 8000000)
    take_text(pair)
