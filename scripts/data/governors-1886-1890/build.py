#!/usr/bin/env python3
"""Visually checked observations from the 1886–1890 economic review."""
import hashlib, json
from pathlib import Path
R = Path(__file__).resolve().parent
def annual(groups):
    return [[y, key, label, v] for key, label, values in groups for y, v in zip(range(1886, 1891), values)]
def seq(key, title, unit, theme, variable, page, description, rows):
    return dict(key=key, title=title, unit=unit, theme=theme, variable=variable, page=page, description=description, rows=rows)
s = [
 seq('vaccinations','Rokotukset ja niiden tarkastus','henkilöä vuodessa','Terveydenhuolto',7,'painettu s. 179 / PDF s. 183','Rokotukset yhteensä ja tarkastuksessa todetut sekä tarkastuksesta pois jääneet. Osajoukot sisältyvät kokonaismäärään. Vuoden 1888 lähteen prosentit eivät vastaa lukumääriä; koko vuoden luvut pidetään tarkistettavina.',annual([('TOTAL','Rokotettuja yhteensä',[61497,65508,78336,77665,70177]),('SUCCESS','Todellisella vaksiiinirokolla',[51904,56030,61845,57720,54157]),('ABSENT','Pois tarkastuksesta',[8064,7371,7422,6796,5419])])),
 seq('granary_stock','Pitäjänmakasiinien varastot vuoden lopussa','hehtolitraa','Ruokahuolto ja kriisivarautuminen',12,'liitetaulu s. 138–139 / PDF s. 303–304','Kirjanpidollinen säästö ja siitä makasiineissa ollut määrä ovat päällekkäisiä, eikä niitä summata. Aiempien havaintojen tynnyriyksikkö on muutettava ennen vertailua.',annual([('BOOK_RYE','Kirjanpidon ruis',[349709,355803,357483,354669,347189]),('BOOK_BARLEY','Kirjanpidon ohra',[201393,204646,206300,208335,208624]),('BOOK_OATS','Kirjanpidon kaura',[45315,47043,49149,50791,57619]),('PHYSICAL_RYE','Makasiineissa ruis',[227976,247414,239619,235635,226493]),('PHYSICAL_BARLEY','Makasiineissa ohra',[126412,135942,135572,130977,133369]),('PHYSICAL_OATS','Makasiineissa kaura',[35756,38297,37149,34956,38208])])),
 seq('hospital_general','Yleisten sairashuoneiden lasarettiosastoissa hoidettuja','hoidettuja, lähteen laskentatapa','Terveydenhuolto',7,'painettu s. 180 / PDF s. 184','Hoidetut eivät välttämättä ole yksilöllisiä henkilöitä; vertailu edellyttää laitosrajausten ja määritelmien tarkistusta.',annual([('FI','Koko maa',[5986,5696,6055,6759,7121])])),
 seq('doctors_qualified','Laillistettuja lääkäreitä 1890','henkilöä','Terveydenhuolto',7,'painettu s. 178 / PDF s. 182','Laillistettujen määrä ei ole sama määritelmä kuin aiemmassa lähteessä mainitut työskentelevät lääkärit.',[[1890,'FI','Koko maa',236]]),
 seq('midwives','Kätilöitä 1890','henkilöä','Terveydenhuolto',7,'painettu s. 178 / PDF s. 182','Vuoden 1885 vertailuluvussa on ero aikaisempaan julkaisuun; määritelmä tulee tarkistaa ennen sarjojen yhdistämistä.',[[1890,'FI','Koko maa',495]]),
 seq('pharmacies','Apteekkeja 1890','apteekkia','Terveydenhuolto',7,'painettu s. 178 / PDF s. 182','Apteekkien lukumäärä, ei henkilöstön määrä.',[[1890,'FI','Koko maa',119]]),
 seq('municipal_doctor_subsidies','Kunnat, jotka saivat valtionapua lääkärin palkkaukseen 1890','kuntaa','Terveydenhuolto',7,'painettu s. 178 / PDF s. 182','Valtionapua saaneiden kuntien määrä; ei kaikkien kunnallisten lääkärien määrä.',[[1890,'FI','Koko maa',23]])
]
p={'batch_id':'governors_1886_1890_selected_20261027_v1','source_title':'Katsaus Suomen taloudelliseen tilaan 1886–1890 (1894)','source_url':'https://otos.stat.fi/server/api/core/bitstreams/c7f58eed-d91a-4f69-b91b-cbf3360d2557/content','source_sha256':'28789b33b397f3bedd417bb9b8068766de6c691bad6f5071ca757ad2f42102b6','series':s}
assert len(s)==7 and sum(len(x['rows']) for x in s)==54
assert all(len({(r[0],r[1]) for r in a['rows']})==len(a['rows']) for a in s)
assert all(s[1]['rows'][15+i][3] <= s[1]['rows'][i][3] for i in range(15))
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
  IF existing<>p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>7 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>54 THEN RAISE EXCEPTION 'Existing batch differs or incomplete'; END IF;
  RETURN;
 END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  sk:='fi.governors1894.'||(s->>'key');
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series exists %',sk; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,s->>'title',s->>'description',p->>'source_title',p->>'source_url',s->>'unit','Suomen historiallinen alue; lähteen rajaus','annual_or_single_year',(SELECT min((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),(SELECT max((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),'historical_source_observation','curated_context',s->>'theme','historical_context',s->>'description',jsonb_build_object('source_page_checked',true,'include_in_composite',false),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_page',s->>'page','historical_borders',true,'include_in_composite',false),true);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(r->>0)::int,r->>1,r->>2,r->>0,(r->>3)::numeric,r->>3,'observed',CASE WHEN s->>'key'='vaccinations' AND (r->>0)::int=1888 THEN 'held_for_source_review' ELSE 'source_snapshot_checked' END,s->>'description',NOT (s->>'key'='vaccinations' AND (r->>0)::int=1888),p->>'source_url','1894',jsonb_build_object('batch_id',bid,'source_page',s->>'page','source_sha256',p->>'source_sha256','include_in_composite',false,'historical_borders',true) FROM jsonb_array_elements(s->'rows') r;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable')::int,sk,'context','Lähteen historiallinen kuvaileva tieto; ei kausaalivaikutus eikä automaattisen yhdistelmäindeksin syöte.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_url',p->>'source_url','source_sha256',p->>'source_sha256','series',7,'rows',54,'published_values',51,'held_values',3,'caveats',jsonb_build_array('Vuoden 1888 rokotustaulukon lukumäärät ja prosentit ovat ristiriidassa; vuoden kaikki kolme arvoa tarkistettavana.','Makasiinivarojen kirjanpidollinen ja fyysinen määrä ovat päällekkäisiä.','Aiemman kauden tynnyriyksikköä ei yhdistetä tämän kauden hehtolitroihin ilman muunnosta.','Laillistettujen ja työskentelevien lääkärien määrät ovat eri käsitteitä.')));
END $load$;
COMMIT;'''
(R/'import.sql').write_text(sql+'\n')
print('7 sarjaa, 54 havaintoa, 3 odottaa:',p['content_sha256'])
