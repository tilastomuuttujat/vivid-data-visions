#!/usr/bin/env python3
"""Transcribe visually checked annual and period values from the user-supplied PDF."""
import hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parent
def annual(groups):return [[y,k,n,v] for k,n,values in groups for y,v in zip(range(1881,1886),values)]
def seq(key,title,unit,theme,variable,page,description,rows,published=True,period=False):return dict(key=key,title=title,unit=unit,theme=theme,variable=variable,page=page,description=description,rows=rows,published=published,period=period)
s=[
seq('vaccinations','Rokotukset ja niiden tarkastus','henkilöä vuodessa','Terveydenhuolto',7,'painettu s.161 / PDF s.165','Lähteen rokotukset yhteensä sekä tarkastuksessa todetut ja tarkastuksesta pois jääneet; osajoukot sisältyvät kokonaismäärään. Aiemman lapsi- ja henkilörajauksen jatkuvuus on varmistettava.',annual([('TOTAL','Rokotettuja yhteensä',[72857,57807,58787,60874,60796]),('SUCCESS','Todellisella vaksiiinirokolla',[60094,48138,50068,52505,52275]),('ABSENT','Pois tarkastuksesta',[10786,7903,7097,7067,7123])])),
seq('granary_stock','Pitäjänmakasiinien varastot vuoden lopussa','tynnyriä','Ruokahuolto ja kriisivarautuminen',12,'liitetaulu s.142–143 / PDF s.285–286','Lähteen koko maan summat: tilipäätöksen mukainen säästö ja siitä makasiineissa ollut määrä ovat päällekkäisiä, niitä ei summata. Fyysisesti makasiinissa ollut ei välttämättä ole vapaasti jaettavissa.',annual([('BOOK_RYE','Kirjanpidon ruis',[192046,197133,201860,207171,210823]),('BOOK_BARLEY','Kirjanpidon ohra',[109405,113857,115844,118483,119547]),('BOOK_OATS','Kirjanpidon kaura',[17504,19571,21103,24099,25164]),('PHYSICAL_RYE','Makasiineissa ruis',[69580,110661,136012,128149,125415]),('PHYSICAL_BARLEY','Makasiineissa ohra',[50391,63158,75245,68990,66877]),('PHYSICAL_OATS','Makasiineissa kaura',[12241,16106,17383,17963,19320])])),
seq('health_staff','Lääkärit ja kätilöt kaupungeissa ja maaseudulla 1885','henkilöä','Terveydenhuolto',7,'painettu s.159–160 / PDF s.163–164','Lähteen 1885 vuoden lopun julkisten, yksityisten ja vapaasti harjoittavien lukumäärät. Alueelliset ryhmät sisältyvät kokonaisuuteen. Ei sama kuin kaikkien laillistettujen määrä.',[[1885,'DOCTOR_ALL','Lääkärit yhteensä',181],[1885,'DOCTOR_CITY','Lääkärit kaupungeissa',146],[1885,'DOCTOR_RURAL','Lääkärit maaseudulla',35],[1885,'MIDWIFE_ALL','Kätilöt yhteensä',381],[1885,'MIDWIFE_CITY','Kätilöt kaupungeissa',218],[1885,'MIDWIFE_RURAL','Kätilöt maaseudulla',163]]),
seq('hospital_general','Yleisten sairashuoneiden lasarettiosastoissa hoidettuja','hoidettuja, lähteen laskentatapa','Terveydenhuolto',7,'painettu s.162 / PDF s.166','Hoidetut eivät välttämättä ole yksilöllisiä henkilöitä; vertailu muihin julkaisuihin vaatii laitosten ja määritelmien tarkistuksen.',annual([('FI','Koko maa',[4905,5340,5181,5575,5708])])),
seq('grain_trade_period','Jauhamattoman viljan tuonti ja vienti viisivuotiskaudella','tynnyriä / 5 vuotta','Ruokahuolto ja kauppa',12,'painettu s.35–36 / PDF s.40–41','Viisivuotinen summa, EI vuoden 1885 havainto. Vuosi 1885 on jakson pääteankkuri. Julkaisematonta kunnes ajanjakso näkyy käyttöliittymässä. Lähteen 1871–1875 tuontiyhteenveto ristiriidassa aikaisemman julkaisun kanssa; vanhoja arvoja ei korvata.',[[1885,'IMPORT','Tuonti 1881–1885',1334163],[1885,'EXPORT','Vienti 1881–1885',1277114]],False,True),
seq('flour_trade_period','Jauhojen tuonti ja vienti viisivuotiskaudella','leiviskää / 5 vuotta','Ruokahuolto ja kauppa',12,'painettu s.35–36 / PDF s.40–41','Viisivuotinen summa, EI vuoden 1885 havainto. Vuosi 1885 on jakson pääteankkuri. Ei yhdistetä tynnyrimääriin ilman perusteltua muuntosääntöä.',[[1885,'IMPORT','Tuonti 1881–1885',40794803],[1885,'EXPORT','Vienti 1881–1885',239697]],False,True)]
p={'batch_id':'governors_1881_1885_selected_20261026_v1','source_title':'Katsaus Suomenmaan taloudelliseen tilaan 1881–1885 (1890)','source_url':'https://otos.stat.fi/server/api/core/bitstreams/12e9d88e-cb40-4fbf-a1e5-6ba847a8588f/content','source_sha256':'e6c7a920ffb308facdc408d7932e3fb8f2e2acf8a4a2af5639080215720a3d3a','series':s}
assert len(s)==6 and sum(len(a['rows']) for a in s)==60
assert all(len({(r[0],r[1]) for r in a['rows']})==len(a['rows']) for a in s)
assert all(s[1]['rows'][15+i][3] <= s[1]['rows'][i][3] for i in range(5))
raw=json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':'));p['content_sha256']=hashlib.sha256(raw.encode()).hexdigest()
(R/'batch.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n');payload=json.dumps(p,ensure_ascii=False,separators=(',',':'));assert '$payload$' not in payload
sql='''BEGIN;
DO $load$
DECLARE p jsonb := $payload$'''+payload+'''$payload$::jsonb; s jsonb; sk text; bid text:=p->>'batch_id'; existing text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(bid));
 SELECT data->>'content_sha256' INTO existing FROM public.dataset_meta WHERE id=bid;
 IF existing IS NOT NULL THEN
  IF existing<>p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>6 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>60 THEN RAISE EXCEPTION 'Existing batch differs or incomplete'; END IF;
  RETURN;
 END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  sk:='fi.governors1890.'||(s->>'key');
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series exists %',sk; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,s->>'title',s->>'description',p->>'source_title',p->>'source_url',s->>'unit','Suomen historiallinen alue; lähteen rajaus',CASE WHEN (s->>'period')::bool THEN 'period_total' ELSE 'annual_or_single_year' END,1881,1885,'historical_source_observation',CASE WHEN (s->>'published')::bool THEN 'curated_context' ELSE 'held_for_period_review' END,s->>'theme','historical_context',s->>'description',jsonb_build_object('source_page_checked',true,'include_in_composite',false),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_page',s->>'page','historical_borders',true,'include_in_composite',false),(s->>'published')::bool);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(r->>0)::int,r->>1,r->>2,CASE WHEN (s->>'period')::bool THEN '1881–1885' ELSE r->>0 END,(r->>3)::numeric,r->>3,'observed',CASE WHEN (s->>'published')::bool THEN 'source_snapshot_checked' ELSE 'held_for_period_review' END,s->>'description',(s->>'published')::bool,p->>'source_url','1890',jsonb_build_object('batch_id',bid,'source_page',s->>'page','source_sha256',p->>'source_sha256','include_in_composite',false,'historical_borders',true,'year_is_period_anchor',(s->>'period')::bool) FROM jsonb_array_elements(s->'rows') r;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable')::int,sk,'context','Lähteen historiallinen kuvaileva tieto; ei kausaalivaikutus eikä automaattisen yhdistelmäindeksin syöte.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_url',p->>'source_url','source_sha256',p->>'source_sha256','series',6,'rows',60,'published_values',56,'held_values',4,'caveats',jsonb_build_array('Viljakaupan viisivuotissummia ei esitetä yhden vuoden arvoina.','Aiemman 1871–1875 jauhamattoman viljan tuontisummaa koskee lähteiden ristiriita; vanhaa arvoa ei muutettu.','Makasiinien kirjanpidolliset ja sisällä olleet varat osittain päällekkäisiä.','Vuoden 1885 työskentelevien lääkärien määrä ja laillistettujen lääkärien määrä eivät ole sama mittari.')));
END $load$;
COMMIT;'''
(R/'import.sql').write_text(sql+'\n');print('6 sarjaa, 60 havaintoa, 4 jaksosummaa odottaa:',p['content_sha256'])
