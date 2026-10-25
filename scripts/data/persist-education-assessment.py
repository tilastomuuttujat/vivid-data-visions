"""Emit immutable assessment manifest into existing dataset_meta; no access changes."""
import json,pathlib,hashlib
root=pathlib.Path(__file__).resolve().parents[2]
p=json.loads((root/'src/data/research/education-assessment.json').read_text());raw=json.dumps(p,ensure_ascii=False,separators=(',',':'))
key='education_assessment_v1:'+hashlib.sha256(raw.encode()).hexdigest()
assert '$education$' not in raw
print("BEGIN; DO $persist$ DECLARE k text := '"+key+"'; p jsonb := $education$"+raw+"$education$::jsonb; BEGIN PERFORM pg_advisory_xact_lock(hashtext(k)); IF EXISTS(SELECT 1 FROM public.dataset_meta WHERE id=k AND data<>p) THEN RAISE EXCEPTION 'Immutable assessment conflict'; END IF; INSERT INTO public.dataset_meta(id,data) VALUES(k,p) ON CONFLICT(id) DO NOTHING; END $persist$; COMMIT;")
print("SELECT id,data->'checks' checks,jsonb_array_length(data->'studies') studies FROM public.dataset_meta WHERE id='"+key+"';")
