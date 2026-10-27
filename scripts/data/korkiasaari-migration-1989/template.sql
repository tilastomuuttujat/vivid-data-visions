BEGIN;
DO $load$
DECLARE p jsonb := $payload$__PAYLOAD__$payload$::jsonb; s jsonb; sk text; bid text:=p->>'batch_id'; existing text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(bid));
 SELECT data->>'content_sha256' INTO existing FROM public.dataset_meta WHERE id=bid;
 IF existing IS NOT NULL THEN
  IF existing<>p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>3 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>44 THEN RAISE EXCEPTION 'Existing batch differs or incomplete'; END IF;
  RETURN;
 END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  sk:='fi.korkiasaari1989.migration.'||(s->>'key');
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series exists %',sk; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,s->>'title',s->>'description',p->>'source_title',p->>'source_url',s->>'unit','Suomen historiallinen alue; lähteen rajaus',CASE WHEN (s->>'period')::boolean THEN 'period_total' ELSE 'annual' END,(SELECT min((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),(SELECT max((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),'historical_source_observation','curated_context',s->>'theme','historical_context',s->>'description',jsonb_build_object('source_page_checked',true,'include_in_composite',false),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_page',s->>'page','historical_borders',true,'include_in_composite',false,'underlying_source',CASE WHEN (s->>'period')::boolean THEN 'SVT XXVIII 1900–1905; Kero 1982a; Toivonen 1963' ELSE 'SVT VI A 1980–1987 osa 1' END),NOT (s->>'period')::boolean);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(r->>0)::int,r->>1,r->>2,CASE WHEN (s->>'period')::boolean THEN r->>4 ELSE r->>0 END,(r->>3)::numeric,r->>3,'observed',CASE WHEN (s->>'period')::boolean THEN 'held_for_period_review' WHEN (r->>0)::int=1987 THEN 'provisional_source_checked' ELSE 'source_snapshot_checked' END,s->>'description',NOT (s->>'period')::boolean,p->>'source_url','1989',jsonb_build_object('batch_id',bid,'source_page',s->>'page','source_sha256',p->>'source_sha256','include_in_composite',false,'historical_borders',true,'year_is_period_anchor',(s->>'period')::boolean,'provisional',(NOT (s->>'period')::boolean AND (r->>0)::int=1987)) FROM jsonb_array_elements(s->'rows') r;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable')::int,sk,'context','Lähteen historiallinen kuvaileva tieto; ei kausaalivaikutus eikä automaattisen yhdistelmäindeksin syöte.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_url',p->>'source_url','source_sha256',p->>'source_sha256','series',3,'rows',44,'published_values',32,'held_values',12,'caveats',jsonb_build_array('Historialliset aluerajat ja lähteiden määritelmät tulee huomioida vertailuissa.','Osaryhmiä ei summata kokonaistietoihin.')));
END $load$;
COMMIT;
