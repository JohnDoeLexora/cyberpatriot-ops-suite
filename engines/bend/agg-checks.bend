# Parallel multi-check aggregation. Collector emits id|status|weight
# status is fail|warn|pass|info. Remaining-work is the sum of weighted fails/warns.
# Heuristic only — not the official CCS scoreboard.
import Base
import ./cp_lib.bend as Lib

def pick_nat(hit: Bool, yes: Nat, no: Nat) -> Nat:
  match hit:
    case True{}:
      yes
    case False{}:
      no

def from_u32(m: Maybe<&2, U32>) -> Nat:
  match m:
    case None{}:
      8n
    case Some{n}:
      U32.to_nat(n)

def status_warn(+status: String, +weight: Nat) -> Nat:
  pick_nat(String.eq(status, "warn"), Nat.div(weight, 3n), 0n)

def status_score(+status: String, +weight: Nat) -> Nat:
  pick_nat(String.eq(status, "fail"), weight, status_warn(status, weight))

def parse_weight(s: String) -> Nat:
  from_u32(U32.read(s))

def score_row(+id: String, +status: String, +weight_s: String) -> Lib.Hit:
  +weight = parse_weight(weight_s)
  +score = status_score(status, weight)
  +tags0 = {"" : String}
  +tags1 = Lib.tag_if(tags0, String.eq(status, "fail"), "fail")
  +tags2 = Lib.tag_if(tags1, String.eq(status, "warn"), "warn")
  +tags3 = Lib.tag_if(tags2, String.eq(status, "pass"), "pass")
  Lib.Hit{id, Lib.sev_of(score), tags3, score}

def score_line(line: String) -> Lib.Hit:
  +cols = String.split(line, '|')
  id = Lib.nth(cols, 0n)
  status = Lib.nth(cols, 1n)
  weight = Lib.nth(cols, 2n)
  score_row(id, status, weight)

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
    +hits : List<&2, Lib.Hit> = score_lines(Lib.drop_empty(String.lines(text)))
    Lib.print_hits("agg", hits)
