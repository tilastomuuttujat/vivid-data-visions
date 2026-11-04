"""Selitysatlas read copy through a service-role-only invoker RPC."""
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

CONFIG = json.loads(r'''{"selitysatlas__categories":{"source":"selitysatlas.categories","columns":["id","title","color","raw"],"pk":["id"],"integers":[],"json":["raw"],"numeric":[],"expected":5},"selitysatlas__contested_explanations":{"source":"selitysatlas.contested_explanations","columns":["id","theme_id","question","status","for_from","for_to","explanations","raw"],"pk":["id"],"integers":[],"json":["explanations","raw"],"numeric":[],"expected":1},"selitysatlas__decisions":{"source":"selitysatlas.decisions","columns":["id","title","year","decision_category","decision_level","decision_posture","decision_paradigm","outcome","evidence","curation_status","actors","sources","summary","materiality_note","raw"],"pk":["id"],"integers":["year"],"json":["decision_paradigm","actors","sources","raw"],"numeric":[],"expected":4},"selitysatlas__dictionary":{"source":"selitysatlas.dictionary","columns":["term","definition","raw"],"pk":["term"],"integers":[],"json":["raw"],"numeric":[],"expected":6},"selitysatlas__evidence_levels":{"source":"selitysatlas.evidence_levels","columns":["id","description","raw"],"pk":["id"],"integers":[],"json":["raw"],"numeric":[],"expected":4},"selitysatlas__exogenous_events":{"source":"selitysatlas.exogenous_events","columns":["id","title","year","scope","description","evidence","sources","raw"],"pk":["id"],"integers":["year"],"json":["sources","raw"],"numeric":[],"expected":2},"selitysatlas__explanation_components":{"source":"selitysatlas.explanation_components","columns":["id","relation_id","type","title","text","evidence","sources","raw"],"pk":["id"],"integers":[],"json":["sources","raw"],"numeric":[],"expected":10},"selitysatlas__generations":{"source":"selitysatlas.generations","columns":["id","person","snapshot_year","age","birth_year","headline","stats","lahtokohdat","valmiudet","era_events","quote","evidence","related_themes","raw"],"pk":["id"],"integers":["snapshot_year","age","birth_year"],"json":["stats","lahtokohdat","valmiudet","era_events","related_themes","raw"],"numeric":[],"expected":13},"selitysatlas__hypotheses":{"source":"selitysatlas.hypotheses","columns":["id","title","claim","prediction","method","metric","supports","exceptions","counters","verdict","confidence","residual_uncertainty","raw"],"pk":["id"],"integers":[],"json":["supports","exceptions","counters","raw"],"numeric":[],"expected":16},"selitysatlas__mechanisms":{"source":"selitysatlas.mechanisms","columns":["id","name","slug","summary","chain","raw"],"pk":["id"],"integers":[],"json":["chain","raw"],"numeric":[],"expected":14},"selitysatlas__meta":{"source":"selitysatlas.meta","columns":["id","data"],"pk":["id"],"integers":["id"],"json":["data"],"numeric":[],"expected":1},"selitysatlas__models":{"source":"selitysatlas.models","columns":["id","name","origin_category","purpose","interpretation","summary","period_start","period_end","evidence","theme_ids","insights","display","raw"],"pk":["id"],"integers":["period_start","period_end"],"json":["theme_ids","insights","display","raw"],"numeric":[],"expected":48},"selitysatlas__open_issues":{"source":"selitysatlas.open_issues","columns":["id","title","description","residual_uncertainty","status","affects","raw"],"pk":["id"],"integers":[],"json":["affects","raw"],"numeric":[],"expected":7},"selitysatlas__questions":{"source":"selitysatlas.questions","columns":["id","question","question_type","core_theme_id","core_kind","preferred_lenses","preferred_model_ids","preferred_story","answer_status","intro","sections","raw"],"pk":["id"],"integers":[],"json":["preferred_lenses","preferred_model_ids","sections","raw"],"numeric":[],"expected":10},"selitysatlas__relations":{"source":"selitysatlas.relations","columns":["id","from_id","from_kind","to_id","to_kind","relation_type","rel_class","directionality","directness","evidence","label","mechanism_slugs","components","synthesis","explanation_model","raw"],"pk":["id"],"integers":[],"json":["mechanism_slugs","components","explanation_model","raw"],"numeric":[],"expected":206},"selitysatlas__sources":{"source":"selitysatlas.sources","columns":["id","name","type","raw"],"pk":["id"],"integers":[],"json":["raw"],"numeric":[],"expected":30},"selitysatlas__stories":{"source":"selitysatlas.stories","columns":["id","title","blurb","model_id","steps","raw"],"pk":["id"],"integers":[],"json":["steps","raw"],"numeric":[],"expected":4},"selitysatlas__themes":{"source":"selitysatlas.themes","columns":["id","name","category","evidence","period_start","period_end","summary","sources","viive_years","viive_note","cycle_phase","cycle_phase_note","display","epistemic","causal","system_position","insights","raw"],"pk":["id"],"integers":["period_start","period_end"],"json":["sources","display","epistemic","causal","system_position","insights","raw"],"numeric":["viive_years"],"expected":87},"infographics":{"source":"public.infographics","columns":["id","storage_path","content_summary","purpose","caption","sort_order","murros_item_id","selitys_theme_id","selitys_model_id","created_at","updated_at","selitys_generation_id","article_id","unpublished","selitys_mechanism_id"],"pk":["id"],"integers":["id","sort_order","unpublished"],"json":[],"numeric":[],"expected":288},"selitysatlas_links":{"source":"public.selitysatlas_links","columns":["id","item_id","theme_id","tier","score","shared_terms","status","note","created_at"],"pk":["id"],"integers":["id"],"json":["shared_terms"],"numeric":["score"],"expected":323}}''')
ORDER = ["selitysatlas__categories","selitysatlas__contested_explanations","selitysatlas__decisions","selitysatlas__dictionary","selitysatlas__evidence_levels","selitysatlas__exogenous_events","selitysatlas__explanation_components","selitysatlas__generations","selitysatlas__hypotheses","selitysatlas__mechanisms","selitysatlas__meta","selitysatlas__models","selitysatlas__open_issues","selitysatlas__questions","selitysatlas__relations","selitysatlas__sources","selitysatlas__stories","selitysatlas__themes","selitysatlas_links","infographics"]
for cfg in CONFIG.values():
    cfg["integers"] = set(cfg["integers"])
    cfg["json"] = set(cfg["json"])
core.CONFIG.update(CONFIG)
REFERENCES = [
 ("selitysatlas__themes","category","selitysatlas__categories","id"),
 ("selitysatlas_links","item_id","items","id"),
 ("selitysatlas_links","theme_id","selitysatlas__themes","id"),
 ("infographics","murros_item_id","items","id"),
 ("infographics","article_id","articles","id"),
 ("infographics","selitys_theme_id","selitysatlas__themes","id"),
 ("infographics","selitys_model_id","selitysatlas__models","id"),
 ("infographics","selitys_generation_id","selitysatlas__generations","id"),
 ("infographics","selitys_mechanism_id","selitysatlas__mechanisms","id"),
]

class Target(Turso):
    def execute(self, statements, close=False):
        statements = [dict(s, sql=s["sql"].replace("public__selitysatlas__", "selitysatlas__")) for s in statements]
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
    for child,column,parent,key in REFERENCES:
        sql=("SELECT count(*) FROM public__"+child+" c LEFT JOIN public__"+parent+
             " p ON c."+column+"=p."+key+" WHERE c."+column+" IS NOT NULL AND p."+key+" IS NULL")
        if core.decode(db.execute([stmt(sql)],close=True)[0])[0][0]:
            raise ValueError("Missing reference: "+child+"."+column)

def migrate(apply=False):
    sources={table:read_source(table) for table in ORDER}
    print("Source preflight: 20 tables, 1079 rows.",flush=True)
    if not apply:
        print("SAMPLE/PARTIAL: source verified only; target not contacted.")
        return
    db=Target()
    for parent,expected in [("items",1112),("articles",314)]:
        actual=core.decode(db.execute([stmt("SELECT count(*) FROM public__"+parent)],close=True)[0])[0][0]
        if actual!=expected:
            raise ValueError("Complete parent transfer: "+parent)
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
    print("PASS: Selitysatlas and infographic metadata; 1079 rows, all contents and references verified.",flush=True)

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
