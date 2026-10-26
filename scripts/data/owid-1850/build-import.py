"""Emit one atomic, insert-only, idempotent DML import from a checked snapshot."""
import json,pathlib
R=pathlib.Path(__file__).resolve().parent
p=json.loads((R/'batch.json').read_text())
raw=json.dumps(p,ensure_ascii=False,separators=(',',':'))
assert '$payload$' not in raw
sql='''BEGIN;
DO $import$
DECLARE p jsonb := $payload$'''+raw+'''$payload$::jsonb; s jsonb; old_hash text; manifest jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(p->>'batch_id'));
 SELECT data->>'content_sha256' INTO old_hash FROM public.dataset_meta WHERE id=p->>'batch_id';
 IF old_hash IS NOT NULL THEN
  IF old_hash<>p->>'content_sha256' THEN RAISE EXCEPTION 'Changed OWID snapshot: new version required'; END IF;
  IF (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=p->>'batch_id')<>35
   OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=p->>'batch_id')<>4711 THEN RAISE EXCEPTION 'Stored batch count mismatch'; END IF;
  RETURN;
 END IF;
 IF jsonb_array_length(p->'series')<>35 THEN RAISE EXCEPTION 'Expected 35 series'; END IF;
 IF (SELECT sum(jsonb_array_length(x->'values')) FROM jsonb_array_elements(p->'series') x)<>4711 THEN RAISE EXCEPTION 'Expected 4711 values'; END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=s->>'series_key') THEN RAISE EXCEPTION 'Series collision: %',s->>'series_key'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.atlas_variables WHERE id=(s->>'variable_id')::bigint) THEN RAISE EXCEPTION 'Missing atlas variable'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(s->'values') v WHERE
   (v->>'year')::int<1850 OR (v->>'year')::int>2025 OR v->>'value_kind' NOT IN ('estimate','projection') OR
   ((v->>'is_published')::boolean AND (v->>'value_kind'='projection' OR jsonb_array_length(v->'hold_reasons')>0))) THEN RAISE EXCEPTION 'Invalid year, kind or publication'; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(s->>'series_key',s->>'title',s->>'description',s->>'source',s->>'source_url',s->>'unit','Finland',s->>'frequency',(s->>'start_year')::int,(s->>'end_year')::int,
   'source_estimates_and_classifications',CASE WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(s->'values') v WHERE (v->>'is_published')::boolean) THEN 'curated_context' ELSE 'needs_review' END,
   (SELECT name FROM public.atlas_variables WHERE id=(s->>'variable_id')::bigint),'historical_context',s->>'description',
   jsonb_build_object('snapshot_hash_verified',true,'original_values_independently_verified',false,'include_in_composite',false,'causal_effect_identified',false,'uncertainty_interval',null),s->'metadata',
   EXISTS(SELECT 1 FROM jsonb_array_elements(s->'values') v WHERE (v->>'is_published')::boolean));
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_retrieved_at,source_version,meta)
  SELECT s->>'series_key',(v->>'year')::int,'FI','Suomi',v->>'year',(v->>'value')::numeric,v->>'value',v->>'value_kind',
   CASE WHEN (v->>'is_published')::boolean THEN 'source_snapshot_checked' ELSE 'held_for_review_or_projection' END,
   s->>'description',(v->>'is_published')::boolean,s->>'source_url',(s->'metadata'->>'source_retrieved_at')::timestamptz,s->'metadata'->>'snapshot_csv_sha256',
   jsonb_build_object('batch_id',p->>'batch_id','source_country','FIN','csv_column',s->>'csv_column','dependency_cluster',s->'metadata'->>'dependency_cluster',
    'temporal_status',v->>'temporal_status','hold_reasons',v->'hold_reasons','source_annotations',v->'annotations','measurement_scale',s->'metadata'->>'measurement_scale','include_in_composite',false,'uncertainty_interval',null)
  FROM jsonb_array_elements(s->'values') v;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale)
  VALUES((s->>'variable_id')::bigint,s->>'series_key','context','OWID-lähdeversio; lähderiippuvuudet ja julkaisurajaukset huomioitava. Ei suora mittaus koko teemasta eikä vahvistettu syyvaikutus.');
 END LOOP;
 manifest:=(p-'series')||jsonb_build_object('series',(SELECT jsonb_agg((x-'values')||jsonb_build_object('row_count',jsonb_array_length(x->'values'),'published_count',(SELECT count(*) FROM jsonb_array_elements(x->'values') v WHERE (v->>'is_published')::boolean))) FROM jsonb_array_elements(p->'series') x));
 INSERT INTO public.dataset_meta(id,data) VALUES(p->>'batch_id',manifest);
 INSERT INTO public.dataset_meta(id,data) VALUES('historical_metrics_owid_1850_20261026_v1',jsonb_build_object('batch_id',p->>'batch_id','content_sha256',p->>'content_sha256',
  'extends_registry','historical_metrics_1850_1899_20261026_v1','main_registry_unchanged','main_metrics_20261026_v1','series_count',35,'value_count',4711,'composite_approved',false,
  'series',(SELECT jsonb_agg(jsonb_build_object('series_key',x->>'series_key','dependency_cluster',x->'metadata'->>'dependency_cluster','weight',null,'year_start',x->'start_year','year_end',x->'end_year')) FROM jsonb_array_elements(p->'series') x)));
END $import$;
COMMIT;
SELECT count(*) AS values,count(*) FILTER(WHERE is_published) AS published,count(*) FILTER(WHERE NOT is_published) AS held,min(year) AS first_year,max(year) AS last_year
FROM public.indicator_values WHERE meta->>'batch_id'='owid_finland_1850_2025_20261026_v1';
'''
(R/'import.sql').write_text(sql)
print('SQL characters',len(sql))
