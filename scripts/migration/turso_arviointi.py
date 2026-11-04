"""Arviointi read copy through a service-role-only invoker RPC."""
import argparse
from decimal import Decimal
import json
import os
import sys
import time
import urllib.error
import urllib.request
import turso_indicators as core
from turso_pilot import SOURCE, Turso, stmt

CONFIG = json.loads(r'''{"arviointi__excluded":{"source":"arviointi.excluded","columns":["matrix_id","phenomenon_id","excluded_at"],"pk":["matrix_id","phenomenon_id"],"integers":[],"json":[],"numeric":[],"expected":2},"arviointi__lens_aggregate":{"source":"arviointi.lens_aggregate","columns":["phenomenon_id","lens_id","seed_direction","mean_direction","mean_cell","contributor_count","spread","source","computed_at","tier"],"pk":["phenomenon_id","lens_id"],"integers":["seed_direction","contributor_count"],"json":[],"numeric":["mean_direction","mean_cell","spread"],"expected":1080},"arviointi__lens_baselines":{"source":"arviointi.lens_baselines","columns":["phenomenon_id","lens_id","direction","role","strength","confidence","basis","rationale","evidence_type","source_count","year","title","updated_at","tier"],"pk":["phenomenon_id","lens_id"],"integers":["direction","source_count","year"],"json":[],"numeric":[],"expected":1080},"arviointi__matrices":{"source":"arviointi.matrices","columns":["id","user_id","name","description","is_default","created_at","updated_at"],"pk":["id"],"integers":["is_default"],"json":[],"numeric":[],"expected":1},"arviointi__overrides":{"source":"arviointi.overrides","columns":["matrix_id","phenomenon_id","lens_id","user_direction","note","updated_at"],"pk":["matrix_id","phenomenon_id","lens_id"],"integers":["user_direction"],"json":[],"numeric":[],"expected":13}}''')
ORDER = ["arviointi__matrices","arviointi__lens_baselines","arviointi__lens_aggregate","arviointi__excluded","arviointi__overrides"]
for cfg in CONFIG.values():
    cfg["integers"] = set(cfg["integers"])
    cfg["json"] = set(cfg["json"])
core.CONFIG.update(CONFIG)
REFERENCES = [["arviointi__excluded",["matrix_id"],"arviointi__matrices",["id"]],["arviointi__lens_aggregate",["phenomenon_id","lens_id"],"arviointi__lens_baselines",["phenomenon_id","lens_id"]],["arviointi__overrides",["phenomenon_id","lens_id"],"arviointi__lens_baselines",["phenomenon_id","lens_id"]],["arviointi__overrides",["matrix_id"],"arviointi__matrices",["id"]]]

class Target(Turso):
    def execute(self, statements, close=False):
        statements = [dict(s, sql=s["sql"].replace("public__arviointi__", "arviointi__")) for s in statements]
        return super().execute(statements, close=close)

def source_page(table, after=None, limit=200):
    if table not in CONFIG or not 1 <= limit <= 500:
        raise ValueError("Invalid source request")
    key = os.environ["SUPABASE_READ_KEY"]
    req = urllib.request.Request(SOURCE + "/rest/v1/rpc/migration_selity_page_v1",
        data=json.dumps({"p_table":CONFIG[table]["source"],"p_after":after,"p_limit":limit}).encode(),
        headers={"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=60) as response:
                rows=json.load(response,parse_float=Decimal)
            if not isinstance(rows,list):
                raise ValueError("Invalid source response")
            return rows
        except urllib.error.HTTPError as error:
            if error.code in (429,500,502,503,504) and attempt<2:
                time.sleep(2**attempt)
                continue
            raise ValueError("Source RPC HTTP "+str(error.code)) from None

def read_source(table):
    cfg=CONFIG[table]
    rows,after=[],None
    while len(rows)<cfg["expected"]:
        page=source_page(table,after)
        if len(page)!=min(200,cfg["expected"]-len(rows)):
            raise ValueError("Source count differs: "+table)
        next_cursor=[page[-1][c] for c in cfg["pk"]]
        if next_cursor==after:
            raise ValueError("Source stopped advancing")
        rows.extend(page)
        after=next_cursor
    if source_page(table,after,1):
        raise ValueError("Extra source rows: "+table)
    for row in rows:
        for column in cfg["numeric"]:
            if row[column] is not None:
                row[column]=str(row[column])
    encoded=[core.transform(table,row) for row in rows]
    if len({row[0] for row in encoded})!=cfg["expected"]:
        raise ValueError("Duplicate source keys")
    return rows,core.page_hash(encoded)

def verify_references(db):
    for child,columns,parent,parent_columns in REFERENCES:
        conditions=" AND ".join("c."+c+"=p."+p for c,p in zip(columns,parent_columns))
        nonnull=" AND ".join("c."+c+" IS NOT NULL" for c in columns)
        sql=("SELECT count(*) FROM public__"+child+" c LEFT JOIN public__"+parent+
             " p ON "+conditions+" WHERE "+nonnull+" AND p."+parent_columns[0]+" IS NULL")
        if core.decode(db.execute([stmt(sql)],close=True)[0])[0][0]:
            raise ValueError("Missing reference: "+child)

def migrate(apply=False):
    sources={table:read_source(table) for table in ORDER}
    print("Source preflight: 5 tables, 2176 rows.",flush=True)
    if not apply:
        print("SAMPLE/PARTIAL: source verified only; target not contacted.")
        return
    db=Target()
    for table in ORDER:
        rows,digest=sources[table]
        db.execute([stmt(core.create(table))],close=True)
        added=0
        for start in range(0,len(rows),100):
            _,n=core.copy_page(db,table,rows[start:start+100],max_row_bytes=4*1024*1024)
            added+=n
        actual=core.decode(db.execute([stmt("SELECT count(*) FROM public__"+table)],close=True)[0])[0][0]
        if actual!=len(rows):
            raise ValueError("Target count differs: "+table)
        for start in range(0,len(rows),50):
            wanted=[core.transform(table,row) for row in rows[start:start+50]]
            got=core.read_page(db,table,[r[0] for r in wanted])
            if {r[0]:r for r in wanted}!={r[0]:r for r in got}:
                raise ValueError("Target content differs: "+table)
        print("Verified:",table,len(rows),"rows;",added,"inserted; SHA256",digest,flush=True)
    verify_references(db)
    for table in ORDER:
        if read_source(table)[1]!=sources[table][1]:
            raise ValueError("Source changed: "+table)
    print("PASS: Arviointi complete; 5 tables, 2176 rows, all contents and 4 internal references verified.",flush=True)

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--apply",action="store_true")
    args=parser.parse_args()
    try:
        migrate(args.apply)
    except Exception as error:
        message="HTTP "+str(error.code) if isinstance(error,urllib.error.HTTPError) else str(error) if isinstance(error,ValueError) else type(error).__name__
        print("FAILED:",message,file=sys.stderr)
        sys.exit(1)
