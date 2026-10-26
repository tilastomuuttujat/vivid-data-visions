#!/usr/bin/env python3
"""Reproducible selected transcription of printed statistics, not OCR output."""
import hashlib, json
from pathlib import Path
R=Path(__file__).resolve().parent
years=list(range(1866,1871))
def grouped(label, values):
 return [[y,key,name,v] for key,name,seq in values for y,v in zip(years,seq) if v is not None]
def series(key,title,unit,theme,variable,page,description,rows,kind='observed',published=True):
 return dict(key=key,title=title,unit=unit,theme=theme,variable=variable,page=page,description=description,rows=rows,kind=kind,published=published)
s=[]
s.append(series('harvest','Ilmoitettu viljasato viljalajeittain','tynnyriä','Maatalous',12,'painettu taulu B, PDF s.52','Lähteen koko maan ilmoitetut sadot, historialliset aluerajat ja yksikkö. Ei satoalaa eikä satoa henkeä kohti.',grouped('',[
 ('FI_WHEAT','Vehnä',[12263,8849,13499,15173,18500]),('FI_RYE','Ruis',[1890188,1112062,1911718,2333958,2516402]),('FI_BARLEY','Ohra',[1150006,611645,1131163,1306566,1448726]),('FI_OATS','Kaura',[1111342,663512,844049,1223075,1165603]),('FI_PEAS','Herneet',[47035,30462,51145,75320,75283])])) )
s.append(series('grain_trade','Jauhamattoman viljan tuonti ja vienti','tynnyriä','Ruokahuolto ja kauppa',12,'painettu taulu C, PDF s.53','Vain jauhamaton vilja; jauhot puuttuvat. Yhteensä sisältää myös vehnän, herneet ja muut viljat: ryhmiä ei saa laskea päällekkäin. Viiva puuttuva/ei ilmoitettu, ei automaattisesti nolla.',grouped('',[
 ('IMPORT_TOTAL','Tuonti yhteensä',[86826,106716,172026,59849,18891]),('IMPORT_RYE','Rukiin tuonti',[55299,60743,61579,25506,6058]),('IMPORT_BARLEY','Ohran tuonti',[12097,29289,67324,8189,3215]),('IMPORT_OATS','Kauran tuonti',[16555,11481,36736,22360,7297]),('EXPORT_TOTAL','Vienti yhteensä',[34040,88565,30238,102523,214772]),('EXPORT_RYE','Rukiin vienti',[4700,22677,4514,22546,37371]),('EXPORT_BARLEY','Ohran vienti',[None,1323,937,752,1552]),('EXPORT_OATS','Kauran vienti',[29306,64562,24659,79188,175744])])) )
s.append(series('hospital_treated','Yleisissä sairaanhoitolaitoksissa hoidetut','hoidettuja, lähteen laskentatapa','Terveydenhuolto',7,'painettu taulu U, PDF s.78','Lähteen laitostyyppien vuotuiset hoidetut; ei välttämättä yksilöllisiä henkilöitä, väestön sairastavuusastetta tai yhtenäisiä nykyluokkia. 1870 viiva jätetty puuttuvaksi.',grouped('',[
 ('DISTRICT','Lääninsairashuoneiden lasaretit',[6115,6366,7759,5188,4539]),('TEMPORARY','Väliaikaiset sairashuoneet',[1084,205,9772,150,None]),('PRISON','Vanki-, oikaisu- ja kehruuhuoneiden lasaretit',[1215,1499,3891,1410,1111])])) )
s.append(series('vaccinations','Rokonpanojen määrä','henkilöä vuodessa','Terveydenhuolto',7,'painettu s.37, PDF s.40','Lähteessä rokonistutuksen saaneet henkilöt; aiempi 1861–1865 lähde puhuu lapsista. Vertailun määritelmät tarkistettava.',grouped('',[('FI','Koko maa',[48880,37763,29814,31798,44286])])) )
s.append(series('vaccinations_births_ratio','Rokonpanojen suhde saman vuoden syntyneisiin','%','Terveydenhuolto',7,'painettu s.37, PDF s.40','Lähteen ilmoittama suhde rokotettujen määrästä vuoden syntyneisiin; ei saman syntymäkohortin rokotuskattavuus.',grouped('',[('FI','Koko maa',[81.1,62.3,66.7,54.5,69.5])])) )
s.append(series('forest_area_estimates','Metsämaan ja kruununmetsien alat, ajanjakson arvio','tynnyrinalaa','Luonnonvarat',10,'painettu s.14, PDF s.17','Lähteen noin-arvio metsää kasvavasta alasta ja erikseen kruununmetsien ilmoitettu ala. Vuosi 1870 on viisivuotisjakson pääteankkuri, ei todettu mittausvuosi. Alue ja määritelmät tarkistettava ennen vertailua 1865 arvoon. Kruununmetsät sisältyvät kokonaisalaan.',[[1870,'ALL','Metsää kasvava ala, noin',46000000],[1870,'CROWN','Kruununmetsät',28450782]],'estimate',False))
s.append(series('tar_exports','Tervan vientimäärä','tynnyriä','Luonnonvarat ja kauppa',10,'painettu s.15, PDF s.18','Tullin ilmoittama tervan vientimäärä. Ei käypähintainen vientiarvo.',grouped('',[('FI','Koko maa',[197246,173476,145070,145325,137377])])) )
s.append(series('board_exports','Lankkujen ja lautojen vientimäärä','kuutiojalkaa, lähteen mitta','Luonnonvarat ja kauppa',10,'painettu s.15, PDF s.18','Tullin ilmoittama lankkujen ja lautojen vientimäärä; alkuperäinen tilavuusyksikkö, ei verrata aiempiin markkamääräisiin vientiarvoihin.',grouped('',[('FI','Koko maa',[16987235,14180598,17132742,17755665,15012432])])) )
p={'batch_id':'governors_1866_1870_crisis_20261026_v1','source_url':'https://otos.stat.fi/server/api/core/bitstreams/9524d9c0-8d11-4727-80c9-ebd345dd268c/content','source_title':'Katsaus Suomen taloudelliseen tilaan vuosina 1866–1870 (1875)','source_sha256':'176f6606f666454812721088436148a4aa25b9b54ee40750e88af324f19f53cd','series':s}
assert len(s)==8 and sum(len(x['rows']) for x in s)==100
assert all(len({(r[0],r[1]) for r in x['rows']})==len(x['rows']) for x in s)
raw=json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':'))
p['content_sha256']=hashlib.sha256(raw.encode()).hexdigest()
(R/'batch.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
payload=json.dumps(p,ensure_ascii=False,separators=(',',':'))
assert '$payload$' not in payload
sql='''BEGIN;
DO $load$
DECLARE p jsonb := $payload$'''+payload+'''$payload$::jsonb; s jsonb; sk text; bid text:=p->>'batch_id'; existing text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(bid));
 SELECT data->>'content_sha256' INTO existing FROM public.dataset_meta WHERE id=bid;
 IF existing IS NOT NULL THEN
  IF existing<>p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>8 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>100 THEN RAISE EXCEPTION 'Existing batch differs or incomplete'; END IF;
  RETURN;
 END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  sk:='fi.governors1875.'||(s->>'key');
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series exists %',sk; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,s->>'title',s->>'description',p->>'source_title',p->>'source_url',s->>'unit','Suomen historiallinen alue; lähteen rajaus','annual_or_period_anchor',1866,1870,CASE WHEN s->>'kind'='estimate' THEN 'historical_estimate' ELSE 'historical_source_observation' END,CASE WHEN (s->>'published')::bool THEN 'curated_context' ELSE 'held_for_period_review' END,s->>'theme','historical_context',s->>'description',jsonb_build_object('source_page_checked',true,'include_in_composite',false),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_page',s->>'page','existing_source_key','poorrelief_svt1875','historical_borders',true,'include_in_composite',false), (s->>'published')::bool);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(r->>0)::int,r->>1,r->>2,CASE WHEN s->>'key'='forest_area_estimates' THEN '1866–1870, tarkka arvioajankohta epäselvä' ELSE r->>0 END,(r->>3)::numeric,r->>3,s->>'kind',CASE WHEN (s->>'published')::bool THEN 'source_snapshot_checked' ELSE 'held_for_period_review' END,s->>'description',(s->>'published')::bool,p->>'source_url','1875',jsonb_build_object('batch_id',bid,'source_page',s->>'page','source_sha256',p->>'source_sha256','include_in_composite',false,'historical_borders',true,'year_is_period_anchor',s->>'key'='forest_area_estimates') FROM jsonb_array_elements(s->'rows') r;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable')::int,sk,'context','Lähteen kuvaileva havainto; ei suoraan kausaalivaikutus, köyhyysaste tai yhteismitallinen nykyisen sarjan kanssa.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_url',p->>'source_url','source_sha256',p->>'source_sha256','existing_source_key','poorrelief_svt1875','series',8,'rows',100,'published_values',98,'notes',jsonb_build_array('Sato on lähteen ilmoittama, historiallisen Suomen alueella.','Jauhamattoman viljan kauppa ei sisällä jauhoja; summat ja erät päällekkäiset.','Sairaaloiden luvut eivät välttämättä ole erillisiä henkilöitä; viivaa ei muuteta nollaksi.','Metsäala-arvion tarkkaa ajankohtaa ja rajojen vertailua ei ole varmistettu; tiedot pidetään pois julkaistavista sarjoista.','Rokotusten suhde syntyneisiin ei ole saman ikäkohortin kattavuus.')));
END $load$;
COMMIT;'''
(R/'import.sql').write_text(sql+'\n')
print('8 series, 100 values, 2 held; batch',p['content_sha256'])
