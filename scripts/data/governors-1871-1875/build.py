#!/usr/bin/env python3
"""Source-bound transcription; regenerate deterministic batch and SQL."""
import hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parent; years=range(1871,1876)
def rows(groups): return [[year,key,label,v] for key,label,values in groups for year,v in zip(years,values) if v is not None]
def seq(key,title,unit,theme,variable,page,description,groups,published=True): return dict(key=key,title=title,unit=unit,theme=theme,variable=variable,page=page,description=description,published=published,rows=rows(groups))
s=[
seq('harvest','Ilmoitettu sato viljalajeittain, julkaistut lähdesummat','tynnyriä','Maatalous',12,'painettu s.104–105; PDF s.104','Taulukossa on maakunnittain ilmoittamatta jääneitä eriä, jotka näkyvät kysymysmerkkeinä tai viivoina. Koko maan lähdesummat eivät välttämättä kata puuttuvia eriä; pidetty julkaisemattomana vertailutarkistukseen asti.',[
 ('FI_WHEAT','Vehnä',[15617,17905,20318,19373,17492]),('FI_RYE','Ruis',[2318139,2279551,2780908,2519048,2705221]),('FI_BARLEY','Ohra',[1389260,1451093,1465268,1133449,1173328]),('FI_OATS','Kaura',[1348451,1312211,1260817,1220264,1179740]),('FI_PEAS','Herneet',[52843,63691,60524,55346,60104])],False),
seq('grain_trade','Jauhamattoman viljan tuonti ja vienti','tynnyriä','Ruokahuolto ja kauppa',12,'painettu s.106–107; PDF s.105','Vain jauhamaton vilja. Yhteensä sisältää myös muita kuin eriteltyjä viljalajeja: erät sisältyvät kokonaisuuteen eikä niitä lasketa yhteen. Jauhot erillisessä leiviskäsarjassa.',[
 ('IMPORT_TOTAL','Tuonti yhteensä',[42001,60932,33237,129082,134375]),('IMPORT_RYE','Rukiin tuonti',[20333,32845,9346,40855,25330]),('IMPORT_BARLEY','Ohran tuonti',[4114,11182,5872,54181,57912]),('IMPORT_OATS','Kauran tuonti',[14964,14347,13848,26773,41534]),('EXPORT_TOTAL','Vienti yhteensä',[341842,148241,157581,179838,52856]),('EXPORT_RYE','Rukiin vienti',[99153,20236,38862,57316,16324]),('EXPORT_BARLEY','Ohran vienti',[41428,1352,7904,3710,368]),('EXPORT_OATS','Kauran vienti',[201137,126644,110777,118765,36141])]),
seq('flour_trade','Jauhojen tuonti ja vienti','leiviskää','Ruokahuolto ja kauppa',12,'painettu s.106–107; PDF s.105','Jauhot ovat painomitta; jauhamaton vilja tilavuusmitta. Lähteen laskennallista yhteismuuntoa ei ole tässä tehty.',[
 ('IMPORT','Jauhojen tuonti',[4263203,6643743,5653377,8153513,10737649]),('EXPORT','Jauhojen vienti',[33581,28457,43207,103036,25695])]),
seq('physicians','Laillisiksi julistetut lääkärit vuoden lopussa','henkilöä','Terveydenhuolto',7,'painettu s.81; PDF s.83','Lähteen laillisiksi julistetut lääkärit; ei suoraan nykyinen työssä olevien lääkärien määritelmä.', [('FI','Koko maa',[121,126,133,133,137])]),
seq('pharmacies','Apteekit ja apteekinlaatikot vuoden lopussa','kappaletta','Terveydenhuolto',7,'painettu s.81; PDF s.83','Kaksi eri palveluluokkaa; apteekinlaatikot eivät ole apteekkeja.', [('PHARMACY','Apteekit yhteensä',[80,80,83,86,93]),('DEPOT','Apteekinlaatikot',[15,21,23,24,26])]),
seq('vaccinations','Rokotettujen määrä','henkilöä vuodessa','Terveydenhuolto',7,'painettu s.82; PDF s.84','Rokonpanot lähteen mukaan. Ei kattavuusprosentti; aiemman 1861–1865 lähteen lapsirajaus ja tämän lähteen henkilörajaukset on tarkistettava.', [('FI','Koko maa',[46308,47657,70138,59594,47940])]),
seq('hospital_treated','Yleisissä sairaanhoitolaitoksissa hoidetut','hoidettuja, lähteen laskentatapa','Terveydenhuolto',7,'painettu s.81; PDF s.83','Laitostyyppien hoidettuja, ei välttämättä yksilöllisiä henkilöitä. Summa sisältää erittelyt; lähteiden laitosluokat voivat muuttua.', [('TOTAL','Kaikki laitokset yhteensä',[15328,15434,14952,14487,13972]),('GENERAL','Yleisten sairashuoneiden lasarettiosastot',[4779,4900,5116,5297,5433]),('PRISON','Vankeus-, ojennus- ja kehruuhuoneen lasaretit',[945,1203,1160,1105,1071])])]
p={'batch_id':'governors_1871_1875_recovery_20261026_v1','source_url':'https://otos.stat.fi/server/api/core/bitstreams/f391a505-9559-4464-bf71-80c6ae66b2cb/content','source_title':'Yleinen katsaus Suomen taloudelliseen tilaan vuosina 1871–1875 (1879)','source_sha256':'64d4d9f24b38141b4ca91ac2a55b61e2f595fa611eb13693e3ada8ef82abbb89','series':s}
assert len(s)==7 and sum(len(x['rows']) for x in s)==110
assert all(len({(r[0],r[1]) for r in x['rows']})==len(x['rows']) for x in s)
assert all(sum(s[1]['rows'][j*5+i][3] for j in (1,2,3))<=s[1]['rows'][i][3] for i in range(5))
raw=json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':'));p['content_sha256']=hashlib.sha256(raw.encode()).hexdigest()
(R/'batch.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n');payload=json.dumps(p,ensure_ascii=False,separators=(',',':'))
assert '$payload$' not in payload
sql='''BEGIN;
DO $load$
DECLARE p jsonb := $payload$'''+payload+'''$payload$::jsonb; s jsonb; sk text; bid text:=p->>'batch_id'; existing text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(bid));
 SELECT data->>'content_sha256' INTO existing FROM public.dataset_meta WHERE id=bid;
 IF existing IS NOT NULL THEN
  IF existing<>p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>7 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>110 THEN RAISE EXCEPTION 'Existing batch differs or incomplete'; END IF;
  RETURN;
 END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  sk:='fi.governors1879.'||(s->>'key');
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series exists %',sk; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,s->>'title',s->>'description',p->>'source_title',p->>'source_url',s->>'unit','Suomen historiallinen alue; lähteen rajaus','annual',1871,1875,'historical_source_observation',CASE WHEN (s->>'published')::bool THEN 'curated_context' ELSE 'held_for_completeness_review' END,s->>'theme','historical_context',s->>'description',jsonb_build_object('source_page_checked',true,'include_in_composite',false),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_page',s->>'page','existing_source_key','poorrelief_svt1879','historical_borders',true,'include_in_composite',false),(s->>'published')::bool);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(r->>0)::int,r->>1,r->>2,r->>0,(r->>3)::numeric,r->>3,'observed',CASE WHEN (s->>'published')::bool THEN 'source_snapshot_checked' ELSE 'held_for_completeness_review' END,s->>'description',(s->>'published')::bool,p->>'source_url','1879',jsonb_build_object('batch_id',bid,'source_page',s->>'page','source_sha256',p->>'source_sha256','include_in_composite',false,'historical_borders',true) FROM jsonb_array_elements(s->'rows') r;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable')::int,sk,'context','Historiallisen lähteen rajattu kuvaileva tieto; ei itsessään kausaalivaikutus eikä automaattinen yhdistelmäindeksin syöte.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_url',p->>'source_url','source_sha256',p->>'source_sha256','existing_source_key','poorrelief_svt1879','series',7,'rows',110,'published_values',85,'held_values',25,'notes',jsonb_build_array('Satotaulukon lääneistä löytyy puuttuvia tietoja; koko maan lähdesummien kattavuus tarkistettava.','Jauhamaton vilja ja jauhot säilytetään alkuperäisissä yksiköissään.','Sairaaloiden luokittelu ja käsitteet eivät välttämättä vastaa edellistä viisivuotisjaksoa.','Kokonaiserät ja alaerät ovat päällekkäisiä.')));
END $load$;
COMMIT;'''
(R/'import.sql').write_text(sql+'\n');print('7 series, 110 values, 25 held; hash',p['content_sha256'])
