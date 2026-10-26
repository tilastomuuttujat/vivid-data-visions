import json,pathlib
R=pathlib.Path(__file__).resolve().parent;p=json.loads((R/'batch.json').read_text());raw=json.dumps(p,ensure_ascii=False,separators=(',',':'))
sql='''BEGIN;
DO $import$
DECLARE p jsonb := $payload$'''+raw+'''$payload$::jsonb; s jsonb; v jsonb; old_hash text; supplement jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(p->>'batch_id'));
 SELECT data->>'content_sha256' INTO old_hash FROM public.dataset_meta WHERE id=p->>'batch_id';
 IF old_hash IS NOT NULL THEN
  IF old_hash<>p->>'content_sha256' THEN RAISE EXCEPTION 'Changed Gapminder batch: create a new version'; END IF;
  RETURN;
 END IF;
 IF jsonb_array_length(p->'series')<>5 THEN RAISE EXCEPTION 'Unexpected series count'; END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=s->>'series_key') THEN RAISE EXCEPTION 'Series collision: %',s->>'series_key'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.atlas_variables WHERE id=(s->>'variable_id')::bigint) THEN RAISE EXCEPTION 'Missing context variable'; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(s->>'series_key',s->>'title',s->>'description',s->>'source',s->>'source_url',s->>'unit','Finland','annual',(s->>'start_year')::int,(s->>'end_year')::int,s->>'data_class','curated',s->>'theme','historical_context',s->>'interpretation',jsonb_build_object('validation_status','source_snapshot_checked','numeric_effect_identified',false,'missing_values_imputed_by_import',false,'uncertainty_interval',null),s->'metadata',true);
  FOR v IN SELECT value FROM jsonb_array_elements(s->'values') LOOP
   IF (v->>'year')::int<1850 OR (v->>'year')::int>2025 OR v->>'group_key'<>'FI' OR v->>'value_kind' NOT IN ('estimate','projection') THEN RAISE EXCEPTION 'Invalid imported observation'; END IF;
   IF (v->>'is_published')::boolean AND (v->>'value_kind'='projection' OR v->>'temporal_status'='estimate_or_projection_boundary_unresolved') THEN RAISE EXCEPTION 'Unresolved future published as history'; END IF;
   INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
   VALUES(s->>'series_key',(v->>'year')::int,'FI','Suomi',v->>'period',(v->>'value')::numeric,v->>'value',v->>'value_kind','source_snapshot_checked',v->>'validation_note',(v->>'is_published')::boolean,s->>'source_url',s->'metadata'->>'source_commit',jsonb_build_object('batch_id',p->>'batch_id','temporal_status',v->>'temporal_status','dependency_cluster',s->'metadata'->>'dependency_cluster','source_concept',s->'metadata'->>'source_concept','source_country','fin','source_unit',s->'metadata'->'source_metadata'->>'unit','unit_resolution',s->'metadata'->>'unit_resolution','include_in_composite',false,'uncertainty_interval',null));
  END LOOP;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable_id')::bigint,s->>'series_key','context','Lähteistetty historiallinen konteksti; yhteys ei osoita yksinomaista mekanismia tai syyvaikutusta. Gapminder-arvioita ei ketjuteta kansalliseen sarjaan automaattisesti.');
 END LOOP;
 supplement:=jsonb_build_object('registry_id','historical_metrics_gapminder_1850_20261026_v1','extends_registry','historical_metrics_1850_1899_20261026_v1','main_registry_unchanged','main_metrics_20261026_v1','batch_id',p->>'batch_id','series_count',5,'phenomena',4,'series',(SELECT jsonb_agg(jsonb_build_object('series_key',x->>'series_key','year_start',x->'start_year','year_end',x->'end_year','dependency_cluster',x->'metadata'->'dependency_cluster','published_history_years',x->'metadata'->'published_history_years','status','historical_estimate_context','composite_approved',false,'weight',null)) FROM jsonb_array_elements(p->'series') x));
 INSERT INTO public.dataset_meta(id,data) VALUES(p->>'batch_id',p);
 INSERT INTO public.dataset_meta(id,data) VALUES('historical_metrics_gapminder_1850_20261026_v1',supplement);
END $import$;
COMMIT;
SELECT s.series_key,count(v.*) rows,min(v.year) first_year,max(v.year) last_year,count(*) FILTER(WHERE v.is_published) published_history FROM public.indicator_series s JOIN public.indicator_values v USING(series_key) WHERE s.metadata->>'batch_id'='gapminder_finland_1850_2025_20261026_v1' GROUP BY s.series_key ORDER BY s.series_key;
''';(R/'import.sql').write_text(sql);print('Import SQL characters',len(sql))
