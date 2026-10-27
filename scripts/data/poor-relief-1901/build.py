#!/usr/bin/env python3
"""Extract figures in the indexed introduction of the official 1901 poor relief report."""
import json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parent
s=[{'key':'municipal_institutions','title':'Kunnalliset vaivaishoitolaitokset 1901','unit':'laitosta','theme':'Köyhyys ja sosiaaliturva','variable':7,'page':'teksti s. 1; hakukoneen indeksoima tekstikatkelma','description':'Kunnalliset vaivaishoitolaitokset lähteen myöhemmän tarkistuksen mukaan: Sortavalan yksityinen diakonialaitos ei ole kunnallinen vaivaistalo. Maaseudun luvussa on yksi lastenkoti. Kaupunki- ja maaseutuluvut sisältyvät koko maan lukuun. Alkuperäinen sivukuva on vielä tarkistettava.','rows':[[1901,'CITY','Kaupungit',24],[1901,'RURAL','Maaseutu',90],[1901,'FI','Koko maa',114]]},{'key':'poor_relief_districts','title':'Vaivaishoitoyhdyskunnat 1901','unit':'yhdyskuntaa','theme':'Köyhyys ja sosiaaliturva','variable':7,'page':'teksti s. 1; hakukoneen indeksoima tekstikatkelma','description':'Vaivaishoitoyhdyskunnat, ei avunsaajien tai laitosten lukumäärä. Kaupunki ja maaseutu sisältyvät koko maan lukuun. Alkuperäinen sivukuva on vielä tarkistettava.','rows':[[1901,'CITY','Kaupungit',37],[1901,'RURAL','Maaseutu',476],[1901,'FI','Koko maa',513]]}]
assert all(a['rows'][0][3]+a['rows'][1][3]==a['rows'][2][3] for a in s)
p={'batch_id':'poor_relief_1901_excerpt_20261027_v1','source_title':'Köyhäinhoito Suomessa vuonna 1901 (1905)','source_url':'https://otos.stat.fi/bitstreams/e8bb4326-7d2e-40ee-a666-afd737d7245f/download','source_sha256':None,'series':s}
raw=json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':'));p['content_sha256']=hashlib.sha256(raw.encode()).hexdigest()
(R/'batch.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
payload=json.dumps(p,ensure_ascii=False,separators=(',',':'));assert '$payload$' not in payload
sql='''BEGIN;
DO $load$
DECLARE p jsonb := $payload$'''+payload+'''$payload$::jsonb; s jsonb; sk text; bid text:=p->>'batch_id'; existing text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(bid));
 SELECT data->>'content_sha256' INTO existing FROM public.dataset_meta WHERE id=bid;
 IF existing IS NOT NULL THEN
  IF existing<>p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>2 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>6 THEN RAISE EXCEPTION 'Existing batch differs or incomplete'; END IF;
  RETURN;
 END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  sk:='fi.poorrelief1901.'||(s->>'key');
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series exists %',sk; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,s->>'title',s->>'description',p->>'source_title',p->>'source_url',s->>'unit','Suomen historiallinen alue; lähteen rajaus','annual_or_single_year',(SELECT min((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),(SELECT max((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),'historical_source_observation','curated_context',s->>'theme','historical_context',s->>'description',jsonb_build_object('source_page_checked',false,'include_in_composite',false),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_page',s->>'page','historical_borders',true,'include_in_composite',false),false);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(r->>0)::int,r->>1,r->>2,r->>0,(r->>3)::numeric,r->>3,'observed','indexed_text_requires_page_review',s->>'description',false,p->>'source_url','1905',jsonb_build_object('batch_id',bid,'source_page',s->>'page','source_sha256',p->>'source_sha256','include_in_composite',false,'historical_borders',true) FROM jsonb_array_elements(s->'rows') r;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable')::int,sk,'context','Lähteen historiallinen kuvaileva tieto; ei kausaalivaikutus eikä automaattisen yhdistelmäindeksin syöte.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_url',p->>'source_url','source_sha256',p->>'source_sha256','series',2,'rows',6,'published_values',0,'held_values',6,'caveats',jsonb_build_array('Luvut poimittu hakukoneen indeksoimasta tekstistä: alkuperäinen sivukuva vielä tarkistettava.','Sortavalan yksityinen diakonialaitos ei kuulu kunnallisten laitosten yhteissummaan.','Kaupunkien ja maaseudun luvut sisältyvät koko maan lukuihin.')));
END $load$;
COMMIT;'''
(R/'import.sql').write_text(sql+'\n')
print('2 sarjaa, 6 tarkistettavaa havaintoa:',p['content_sha256'])
