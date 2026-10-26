"""Generate an atomic, version-guarded insert-only import."""
import json,pathlib
R=pathlib.Path(__file__).resolve().parent;p=json.loads((R/'batch.json').read_text());raw=json.dumps(p,ensure_ascii=False,separators=(',',':'))
assert '$payload$' not in raw
sql='''BEGIN;
DO $import$
DECLARE p jsonb := $payload$'''+raw+'''$payload$::jsonb; s jsonb; old_hash text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(p->>'batch_id'));
 SELECT data->>'content_sha256' INTO old_hash FROM public.dataset_meta WHERE id=p->>'batch_id';
 IF old_hash IS NOT NULL THEN
  IF old_hash<>p->>'content_sha256' THEN RAISE EXCEPTION 'Changed source batch: create a new version'; END IF;
  IF (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=p->>'batch_id')<>32
   OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=p->>'batch_id')<>4774 THEN RAISE EXCEPTION 'Stored batch count mismatch'; END IF;
  RETURN;
 END IF;
 IF jsonb_array_length(p->'series')<>32 OR (SELECT sum(jsonb_array_length(x->'values')) FROM jsonb_array_elements(p->'series') x)<>4774 THEN RAISE EXCEPTION 'Unexpected batch shape'; END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=s->>'series_key') THEN RAISE EXCEPTION 'Series collision: %',s->>'series_key'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.atlas_variables WHERE id=(s->>'variable_id')::bigint) THEN RAISE EXCEPTION 'Missing context variable'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(s->'values') v WHERE (v->>'year')::int<1850 OR (v->>'year')::int>2025 OR v->>'value_kind'<>'estimate') THEN RAISE EXCEPTION 'Invalid year or kind'; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(s->>'series_key',s->>'title',s->>'description',s->>'source',s->>'source_url',s->>'unit','Finland',s->>'frequency',(s->>'start_year')::int,(s->>'end_year')::int,
   CASE WHEN s->'metadata'->>'calculation_type' IS NOT NULL THEN 'derived_historical_estimate' ELSE 'historical_source_compilation' END,'curated_context',
   (SELECT name FROM public.atlas_variables WHERE id=(s->>'variable_id')::bigint),'historical_context',s->>'description',
   jsonb_build_object('source_snapshot_checked',true,'original_estimates_independently_verified',false,'include_in_composite',false,'causal_effect_identified',false,'uncertainty_interval',null),s->'metadata',true);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_retrieved_at,source_version,meta)
  SELECT s->>'series_key',(v->>'year')::int,'FI','Suomi',v->>'year',(v->>'value')::numeric,v->>'value','estimate','source_snapshot_checked',s->>'description',true,s->>'source_url',
   (s->'metadata'->>'source_retrieved_at')::timestamptz,s->'metadata'->>'source_version',
   COALESCE(v->'meta','{}'::jsonb)||jsonb_build_object('batch_id',p->>'batch_id','dependency_cluster',s->'metadata'->>'dependency_cluster','include_in_composite',false,'source_country','FIN','uncertainty_interval',null)
  FROM jsonb_array_elements(s->'values') v;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale)
  VALUES((s->>'variable_id')::bigint,s->>'series_key','context','Historiallinen lähdesarja tai eksplisiittinen johdos. Käsitteelliset rajaukset, lähdekatkokset ja riippuvuusklusteri huomioitava; ei vahvistettu syyvaikutus.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(p->>'batch_id',(p-'series')||jsonb_build_object('series',(SELECT jsonb_agg((x-'values')||jsonb_build_object('row_count',jsonb_array_length(x->'values'))) FROM jsonb_array_elements(p->'series') x)));
 INSERT INTO public.dataset_meta(id,data) VALUES('historical_metrics_finance_prices_1850_20261026_v1',jsonb_build_object('batch_id',p->>'batch_id','content_sha256',p->>'content_sha256','extends_registry','historical_metrics_1850_1899_20261026_v1','main_registry_unchanged','main_metrics_20261026_v1','series_count',32,'value_count',4774,'composite_approved',false,'series',(SELECT jsonb_agg(jsonb_build_object('series_key',x->>'series_key','dependency_cluster',x->'metadata'->>'dependency_cluster','weight',null,'start_year',x->'start_year','end_year',x->'end_year')) FROM jsonb_array_elements(p->'series') x)));
END $import$;
COMMIT;
SELECT count(*) AS values,min(year) AS first_year,max(year) AS last_year FROM public.indicator_values WHERE meta->>'batch_id'='historical_finance_prices_1850_20261026_v1';
'''
(R/'import.sql').write_text(sql);print('SQL characters',len(sql))
