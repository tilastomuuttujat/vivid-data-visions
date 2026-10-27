BEGIN;
DO $load$
DECLARE p jsonb := $payload$__PAYLOAD__$payload$::jsonb; s jsonb; sk text; bid text:=p->>'batch_id'; existing text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(bid));
 SELECT data->>'content_sha256' INTO existing FROM public.dataset_meta WHERE id=bid;
 IF existing IS NOT NULL THEN
  IF existing<>p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>__COUNT_SERIES__ OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>__COUNT_ROWS__ THEN RAISE EXCEPTION 'Existing batch differs or incomplete'; END IF;
  RETURN;
 END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  sk:='__PREFIX__'||(s->>'key');
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series exists %',sk; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,s->>'title',s->>'description',p->>'source_title',p->>'source_url',s->>'unit','Suomen historiallinen alue; lähteen rajaus','annual_or_single_year',(SELECT min((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),(SELECT max((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),'historical_source_observation','curated_context',s->>'theme','historical_context',s->>'description',jsonb_build_object('source_page_checked',true,'include_in_composite',false),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_page',s->>'page','historical_borders',true,'include_in_composite',false),true);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(r->>0)::int,r->>1,r->>2,r->>0,(r->>3)::numeric,r->>3,'observed','source_snapshot_checked',s->>'description',true,p->>'source_url',CASE WHEN bid LIKE '%poor1901%' THEN '1905' ELSE '1904' END,jsonb_build_object('batch_id',bid,'source_page',s->>'page','source_sha256',p->>'source_sha256','include_in_composite',false,'historical_borders',true) FROM jsonb_array_elements(s->'rows') r;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable')::int,sk,'context','Lähteen historiallinen kuvaileva tieto; ei kausaalivaikutus eikä automaattisen yhdistelmäindeksin syöte.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_url',p->>'source_url','source_sha256',p->>'source_sha256','series',__COUNT_SERIES__,'rows',__COUNT_ROWS__,'published_values',__COUNT_ROWS__,'held_values',0,'caveats',jsonb_build_array('Historialliset aluerajat ja lähteiden määritelmät tulee huomioida vertailuissa.','Osaryhmiä ei summata kokonaistietoihin.')));
END $load$;
COMMIT;
