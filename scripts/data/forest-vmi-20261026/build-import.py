"""Generate one atomic, immutable forest supplement import (DML only)."""
import json,pathlib
R=pathlib.Path(__file__).resolve().parent;p=json.loads((R/'batch.json').read_text());raw=json.dumps(p,ensure_ascii=False,separators=(',',':'));assert '$payload$' not in raw
sql='''BEGIN;
DO $import$
DECLARE p jsonb := $payload$'''+raw+'''$payload$::jsonb; s jsonb; old_hash text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(p->>'batch_id'));
 SELECT data->>'content_sha256' INTO old_hash FROM public.dataset_meta WHERE id=p->>'batch_id';
 IF old_hash IS NOT NULL THEN
  IF old_hash<>p->>'content_sha256' THEN RAISE EXCEPTION 'Changed forest source snapshot: new version required'; END IF;
  IF (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=p->>'batch_id')<>11 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=p->>'batch_id')<>1018 THEN RAISE EXCEPTION 'Stored forest count mismatch'; END IF;
  RETURN;
 END IF;
 IF jsonb_array_length(p->'series')<>11 OR (SELECT sum(jsonb_array_length(x->'values')) FROM jsonb_array_elements(p->'series') x)<>1018 THEN RAISE EXCEPTION 'Unexpected forest batch shape'; END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=s->>'series_key') THEN RAISE EXCEPTION 'Series collision: %',s->>'series_key'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.atlas_variables WHERE id=(s->>'variable_id')::bigint) THEN RAISE EXCEPTION 'Missing context variable'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(s->'values') v WHERE (v->>'year')::int<1850 OR (v->>'year')::int>2025 OR v->>'value_kind'<>'estimate' OR ((v->>'is_published')::boolean AND jsonb_array_length(v->'meta'->'hold_reasons')>0)) THEN RAISE EXCEPTION 'Invalid forest value'; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(s->>'series_key',s->>'title',s->>'description',s->>'source',s->>'source_url',s->>'unit','Finland; source regions and explicit historical-border variants',s->>'frequency',(s->>'start_year')::int,(s->>'end_year')::int,
   'inventory_or_statistical_estimate','curated_context','Luonnonvarat','historical_context',s->>'description',jsonb_build_object('source_snapshot_checked',true,'original_estimates_independently_verified',false,'include_in_composite',false,'uncertainty_interval',null),s->'metadata',true);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_retrieved_at,source_version,meta)
  SELECT s->>'series_key',(v->>'year')::int,v->>'group_key',v->>'group_label',v->>'period',(v->>'value')::numeric,v->>'value','estimate',CASE WHEN (v->>'is_published')::boolean THEN 'source_snapshot_checked' ELSE 'held_for_source_review' END,s->>'description',(v->>'is_published')::boolean,s->>'source_url',(s->'metadata'->>'source_retrieved_at')::timestamptz,s->'metadata'->>'source_file_sha256',v->'meta'||jsonb_build_object('batch_id',p->>'batch_id','dependency_cluster',s->'metadata'->>'dependency_cluster')
  FROM jsonb_array_elements(s->'values') v;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale)
  VALUES((s->>'variable_id')::bigint,s->>'series_key','context','Luken metsävarojen ja puunkäytön lähdeversio; inventointijaksot, maa-alakäsite, aluerajaus ja julkaisurajaukset säilytettävä. Ei kausaalivaikutus tai koko luonnonvarateeman numeerinen mittaus.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(p->>'batch_id',(p-'series')||jsonb_build_object('series',(SELECT jsonb_agg((x-'values')||jsonb_build_object('row_count',jsonb_array_length(x->'values'),'published_count',(SELECT count(*) FROM jsonb_array_elements(x->'values') v WHERE (v->>'is_published')::boolean))) FROM jsonb_array_elements(p->'series') x)));
END $import$;
COMMIT;
SELECT count(*) AS values,count(*) FILTER(WHERE is_published) AS published,count(*) FILTER(WHERE NOT is_published) AS held,min(year) AS first_anchor_or_year,max(year) AS last_anchor_or_year FROM public.indicator_values WHERE meta->>'batch_id'='luke_forest_vmi_1918_2025_20261026_v1';
''';(R/'import.sql').write_text(sql);print('SQL characters',len(sql))
