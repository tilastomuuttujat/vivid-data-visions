"""Emit immutable, idempotent inventory manifest; no DDL or access changes."""
import json,pathlib,hashlib
root=pathlib.Path(__file__).resolve().parents[2]
p=json.loads((root/'src/data/research/theme-coverage.json').read_text())
raw=json.dumps(p,ensure_ascii=False,separators=(',',':'))
key='theme_coverage_v1:'+hashlib.sha256(raw.encode()).hexdigest()
assert '$coverage$' not in raw
print("BEGIN; DO $persist$ DECLARE k text := '"+key+"'; p jsonb := $coverage$"+raw+"$coverage$::jsonb; BEGIN PERFORM pg_advisory_xact_lock(hashtext(k)); IF EXISTS(SELECT 1 FROM public.dataset_meta WHERE id=k AND data<>p) THEN RAISE EXCEPTION 'Immutable coverage conflict'; END IF; INSERT INTO public.dataset_meta(id,data) VALUES(k,p) ON CONFLICT(id) DO NOTHING; END $persist$; COMMIT;")
print("SELECT id,jsonb_array_length(data->'cells') cells,data->'counts' counts FROM public.dataset_meta WHERE id='"+key+"';")
