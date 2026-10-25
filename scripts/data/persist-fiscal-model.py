"""Emit transactional idempotent SQL for reviewed inputs/output in dataset_meta.
Apply with the authorized SQL connector or psql. No credentials are embedded.
"""
import json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
inputs=json.loads((ROOT/'src/data/research/fiscal-inputs.json').read_text())
model=json.loads((ROOT/'src/data/research/fiscal-model.json').read_text())
verification=json.loads((ROOT/'src/data/research/fiscal-verification.json').read_text())
payloads=[('fiscal_verification_v1:'+model['input_sha256']+':'+__import__('hashlib').sha256(json.dumps(verification,sort_keys=True).encode()).hexdigest(),verification),('fiscal_inputs_v1:'+model['input_sha256'],inputs),('fiscal_balance_v1:'+model['release_id'],model)]
print('BEGIN;')
for key,p in payloads:
 raw=json.dumps(p,ensure_ascii=False,separators=(',',':'))
 assert '$fiscal$' not in raw
 print("DO $persist$ DECLARE p jsonb := $fiscal$"+raw+"$fiscal$::jsonb; k text := '"+key+"'; BEGIN PERFORM pg_advisory_xact_lock(hashtext(k)); IF EXISTS(SELECT 1 FROM public.dataset_meta WHERE id=k AND data<>p) THEN RAISE EXCEPTION 'Immutable fiscal payload conflict'; END IF; INSERT INTO public.dataset_meta(id,data) VALUES(k,p) ON CONFLICT(id) DO NOTHING; END $persist$;")
print("COMMIT; SELECT id, data->>'release_id' release_id,jsonb_array_length(data->'points') points FROM public.dataset_meta WHERE id='fiscal_balance_v1:"+model['release_id']+"';")
