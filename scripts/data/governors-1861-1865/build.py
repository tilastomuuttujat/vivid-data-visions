import hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parent
p=json.loads((R/'batch.json').read_text())
assert len(p['series'])==6 and sum(len(s['rows']) for s in p['series'])==27
assert all(1850<=r[0]<=2025 for s in p['series'] for r in s['rows'])
assert all(len({(r[0],r[1]) for r in s['rows']})==len(s['rows']) for s in p['series'])
raw=json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':'))
p['content_sha256']=hashlib.sha256(raw.encode()).hexdigest()
payload=json.dumps(p,ensure_ascii=False,separators=(',',':'))
assert '$payload$' not in payload
sql='''BEGIN;
DO $load$
DECLARE p jsonb := $payload$'''+payload+'''$payload$::jsonb; s jsonb; sk text; bid text := p->>'batch_id'; existing text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(bid));
 SELECT data->>'content_sha256' INTO existing FROM public.dataset_meta WHERE id=bid;
 IF existing IS NOT NULL THEN
  IF existing<>p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>6 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>27 THEN RAISE EXCEPTION 'Existing batch differs or is incomplete'; END IF;
  RETURN;
 END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  sk := 'fi.governors1868.'||(s->>'key');
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series key exists %',sk; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.atlas_variables WHERE id=(s->>'variable')::int) THEN RAISE EXCEPTION 'Missing variable'; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,s->>'title',s->>'description',p->>'source_title',p->>'source_url',s->>'unit','Suomen historiallinen alue vuonna 1865','annual_or_single_year',1861,1865,CASE WHEN s->>'kind'='estimate' THEN 'historical_estimate' ELSE 'historical_source_observation' END,'curated_context',s->>'theme','historical_context',s->>'description',jsonb_build_object('source_page_checked',true,'include_in_composite',false),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_page',s->>'page','source_key_existing','poorrelief_svt1868','historical_borders',true,'include_in_composite',false),true);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(r->>0)::int,r->>1,r->>2,r->>0,(r->>3)::numeric,r->>3,s->>'kind','source_snapshot_checked',s->>'description',true,p->>'source_url','1868',jsonb_build_object('batch_id',bid,'source_page',s->>'page','source_sha256',p->>'source_sha256','historical_borders',true,'include_in_composite',false) FROM jsonb_array_elements(s->'rows') r;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable')::int,sk,'context','Lähteen aikakauteen ja aluerajaukseen sidottu kuvaileva tieto; ei kausaalivaikutus eikä automaattinen yhdistelmäindeksin syöte.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_url',p->>'source_url','source_sha256',p->>'source_sha256','existing_source_key','poorrelief_svt1868','rows',27,'series',6,'caveats',jsonb_build_array('Vanhat alue- ja mittayksiköt; havaintoja ei automaattisesti yhdistetä nykysarjoihin.','Lainamakasiinin kirjoihin kirjattu määrä ei kuvaa suoraan fyysistä käytettävyyttä.','Puuaineiden vientiarvo sisältyy metsäviennin kokonaisarvoon.','Kruununmetsien ala ei ole puuston määrä eikä koko Suomen metsäala.')));
END $load$;
COMMIT;'''
(R/'import.sql').write_text(sql+'\n')
print('6 series, 27 observations; batch hash',p['content_sha256'])
