# Parallel scoring of local listeners vs an expected baseline.
# Collector emits proto|port|addr|proc|expected (1=in baseline). Local image only.
import Base
import ./cp_lib.bend as Lib

def flag1(s: String) -> Bool:
  String.eq(s, "1")

def w_if(hit: Bool, yes: Nat, no: Nat) -> Nat:
  match hit:
    case True{}:
      yes
    case False{}:
      no

def port_weight6(+port: String) -> Nat:
  w_if(Bool.or(String.eq(port, "3389"), Bool.or(String.eq(port, "5900"), Bool.or(String.eq(port, "513"), String.eq(port, "514")))), 20n, 0n)

def port_weight5(+port: String) -> Nat:
  w_if(Bool.or(String.eq(port, "139"), Bool.or(String.eq(port, "445"), Bool.or(String.eq(port, "111"), String.eq(port, "135")))), 22n, port_weight6(port))

def port_weight4(+port: String) -> Nat:
  w_if(Bool.or(String.eq(port, "21"), Bool.or(String.eq(port, "69"), String.eq(port, "512"))), 30n, port_weight5(port))

def port_weight3(+port: String) -> Nat:
  w_if(String.eq(port, "23"), 35n, port_weight4(port))

def port_weight2(+port: String) -> Nat:
  w_if(String.eq(port, "4444"), 40n, port_weight3(port))

def port_weight(+port: String) -> Nat:
  w_if(String.eq(port, "31337"), 40n, port_weight2(port))

def pick_expected(expected: Bool, unexpected_score: Nat, weight: Nat) -> Nat:
  match expected:
    case True{}:
      weight
    case False{}:
      unexpected_score

def score_port(+proto: String, +port: String, +addr: String, +proc: String, +expected: Bool) -> Lib.Hit:
  +weight = port_weight(port)
  +public = Bool.or(String.eq(addr, "0.0.0.0"), String.eq(addr, "*"))
  +unexpected = Bool.not(expected)
  +score0 = {0n : Nat}
  +score1 = Lib.add_if(score0, unexpected, 12n)
  +score2 = Lib.add_if(score1, Bool.and(unexpected, public), 8n)
  +score3 = Nat.add(score2, weight)
  +score4 = pick_expected(expected, score3, weight)
  +label = proto ++ "/" ++ port
  +tags0 = {"" : String}
  +tags1 = Lib.tag_if(tags0, unexpected, "unexpected")
  +tags2 = Lib.tag_if(tags1, public, "public-bind")
  +tags3 = Lib.tag_if(tags2, Nat.is_gt(weight, 0n), "suspicious-port")
  +tags4 = Lib.tag_if(tags3, expected, "expected")
  Lib.Hit{label, Lib.sev_of(score4), tags4, score4}

def score_line(line: String) -> Lib.Hit:
  +cols = String.split(line, '|')
  proto = Lib.nth(cols, 0n)
  port = Lib.nth(cols, 1n)
  addr = Lib.nth(cols, 2n)
  proc = Lib.nth(cols, 3n)
  expected = flag1(Lib.nth(cols, 4n))
  score_port(proto, port, addr, proc, expected)

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
    Lib.print_hits("ports", hits)
