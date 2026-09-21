#!/usr/bin/env bash
# Read-only MySQL/Postgres bind-address audit. No SQL, no passwords.
set -euo pipefail
python3 - <<'PY'
import json, os, re, glob
def read(p):
    try: return open(p, encoding="utf-8", errors="replace").read()
    except OSError: return ""
my = "".join(read(p) for p in [
    "/etc/mysql/my.cnf","/etc/mysql/mysql.conf.d/mysqld.cnf",
    "/etc/mysql/mariadb.conf.d/50-server.cnf","/etc/my.cnf"])
pg = "".join(read(p) for p in glob.glob("/etc/postgresql/*/main/postgresql.conf"))
hba = "".join(read(p) for p in glob.glob("/etc/postgresql/*/main/pg_hba.conf"))
findings = []
bind = None
m = re.findall(r"^\s*bind-address\s*=\s*(\S+)", my, re.M)
if m: bind = m[-1]
if bind and bind not in ("127.0.0.1","::1","localhost"):
    findings.append({"id":"bind","severity":"high","title":f"mysqld bind-address={bind}"})
if re.search(r"skip-grant-tables", my):
    findings.append({"id":"skip","severity":"critical","title":"skip-grant-tables set"})
if re.search(r"host\s+all\s+all\s+0\.0\.0\.0/0\s+trust", hba):
    findings.append({"id":"trust","severity":"critical","title":"pg_hba trust from anywhere"})
print(json.dumps({"ok": True, "findings": findings, "extra": {"bind": bind, "note": "No SQL connections"}}))
PY
