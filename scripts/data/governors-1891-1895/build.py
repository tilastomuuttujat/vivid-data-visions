#!/usr/bin/env python3
"""Reproducible, page-checked extraction of the 1891–1895 economic review."""
import json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parent
def annual(groups):
 return [[y,k,n,v] for k,n,values in groups for y,v in zip(range(1891,1896),values)]
def seq(key,title,unit,theme,variable,page,description,rows):
 return dict(key=key,title=title,unit=unit,theme=theme,variable=variable,page=page,description=description,rows=rows)
land=[('UUSIMAA','Uudenmaan lääni',[5968,216,1129,4098,525]),('TURKU_PORI','Turun ja Porin lääni',[11163,349,3149,6080,1585]),('HAME','Hämeen lääni',[7157,492,1961,4257,447]),('VIIPURI','Viipurin lääni',[30838,381,6759,13945,9753]),('MIKKELI','Mikkelin lääni',[9385,628,1526,4983,2248]),('KUOPIO','Kuopion lääni',[15056,308,2773,7595,4380]),('VAASA','Vaasan lääni',[22680,441,4314,13066,4859]),('OULU','Oulun lääni',[15543,8,524,6097,8914]),('FI','Koko maa',[117790,2823,22135,60121,32711])]
cats=[('TOTAL','yhteensä'),('GE100','100 ha tai enemmän'),('25_100','25–100 ha'),('5_25','5–25 ha'),('LT5','alle 5 ha')]
assert all(v[0]==sum(v[1:]) for _,_,v in land)
assert all(sum(row[2][i] for row in land[:-1])==land[-1][2][i] for i in range(5))
s=[
seq('granary_stock','Pitäjänmakasiinien varastot vuoden lopussa','hehtolitraa','Ruokahuolto ja kriisivarautuminen',12,'liitetaulu s. 128–129 / PDF s. 316','Kirjanpidolliset säästöt ja niistä sisällä olleet varastot ovat päällekkäisiä, ei summata; alue on aikakauden Suomi.',annual([('BOOK_RYE','Kirjanpidon ruis',[344156,350970,359344,370481,374418]),('BOOK_BARLEY','Kirjanpidon ohra',[204796,201420,212310,221960,221507]),('BOOK_OATS','Kirjanpidon kaura',[53918,58621,62997,74460,77361]),('PHYSICAL_RYE','Makasiineissa ruis',[193449,122032,159418,207930,249552]),('PHYSICAL_BARLEY','Makasiineissa ohra',[117514,57422,80723,115018,144720]),('PHYSICAL_OATS','Makasiineissa kaura',[31451,35260,39663,51239,59283])])),
seq('vaccinations','Rokotukset ja niiden tarkastus','henkilöä vuodessa','Terveydenhuolto',7,'teksti s. 199 / PDF s. 204','Rokotetut, rokotusvelvolliset ja niiden osaryhmät. Vuoden 1895 tarkastuksesta pois jääneiden lukumäärä ja lähdeprosentti ristiriidassa: arvo odottaa tarkistusta. Rokotusvelvollisten suhde eroaa aiemman lähteen elävänä syntyneiden suhteesta.',annual([('ELIGIBLE','Rokotusvelvollisia',[94941,100536,94280,89415,88507]),('TOTAL','Rokotettuja',[67897,72061,67797,59558,66759]),('SUCCESS','Täydellisellä menestyksellä',[53725,57334,54930,49850,56205]),('ABSENT','Pois tarkastuksesta',[4854,5197,4319,3854,6887])])),
seq('landowner_size','Maanomistajat viljellyn maan kokoluokan ja läänin mukaan 1895','kuntailmoitusten maanomistajalukumäärä','Maanomistus ja maatalous',12,'liitetaulu s. 48 / PDF s. 260','Kuntien arvioihin perustuvassa yhteenvedossa sama maanomistaja voi esiintyä useamman kerran, jos hänellä on tiloja eri kunnissa. Luokka kuvaa viljeltyä alaa, ei tilan kokonaisalaa; luokkarajat lähteen mukaiset.',[[1895,area+'_'+key,label+' – '+name,v[i]] for area,label,v in land for i,(key,name) in enumerate(cats)]),
seq('poorrelief_total_new','Köyhäinhoidon kustannukset uuden tilastointitavan mukaan','nimellistä Suomen markkaa vuodessa','Köyhyys ja sosiaaliturva',7,'teksti s. 207 / PDF s. 212','Lähteen mukaan vuoden 1891 kaavojen mukainen laaja köyhäinhoidon kokonaiskustannus; kuvernöörien suppeampi sarja kattaa suoranaiset köyhäinhoitolaisten kulut. Ei suoraan yhtenäinen sarja. Nimellisarvoja ei inflaatiokorjattu.',[[1893,'FI','Koko maa',4866190],[1894,'FI','Koko maa',4892620],[1895,'FI','Koko maa',4720446]]),
seq('doctors_qualified','Laillistettuja lääkäreitä 1895','henkilöä','Terveydenhuolto',7,'teksti s. 198 / PDF s. 203','Oikeutettujen lääkärien määrä, ei välttämättä sama kuin työssä olevat.',[[1895,'FI','Koko maa',281]]),
seq('midwives','Kätilöt 1895 kaupungeissa ja maaseudulla','henkilöä','Terveydenhuolto',7,'teksti s. 198 / PDF s. 203','Kaupunki ja maaseutu sisältyvät koko maan määrään.',[[1895,'FI','Koko maa',610],[1895,'CITY','Kaupungit',260],[1895,'RURAL','Maaseutu',350]]),
seq('pharmacies','Apteekkeja 1895','apteekkia','Terveydenhuolto',7,'teksti s. 198 / PDF s. 203','Apteekkien lukumäärä.',[[1895,'FI','Koko maa',140]]),
seq('municipal_doctor_districts','Kunnallislääkäripiirit 1895','piiriä','Terveydenhuolto',7,'teksti s. 198 / PDF s. 203','Piirit kattoivat 82 kuntaa. Lääkäri- ja kuntamäärät eivät ole sama mittari.',[[1895,'FI','Koko maa',55]]),
seq('municipal_doctor_municipalities','Kunnallislääkäripiireihin kuuluneet kunnat 1895','kuntaa','Terveydenhuolto',7,'teksti s. 198 / PDF s. 203','55 kunnallislääkäripiiriin kuuluneet 82 kuntaa.',[[1895,'FI','Koko maa',82]])
]
assert all(s[0]['rows'][15+i][3]<=s[0]['rows'][i][3] for i in range(15))
assert len(s)==9 and sum(len(a['rows']) for a in s)==105
assert all(len({(r[0],r[1]) for r in a['rows']})==len(a['rows']) for a in s)
p={'batch_id':'governors_1891_1895_selected_20261027_v1','source_title':'Katsaus Suomen taloudelliseen tilaan 1891–1895 (1899)','source_url':'https://otos.stat.fi/server/api/core/bitstreams/0ec35e33-c947-48e6-9683-06b2ad4a8bab/content','source_sha256':'82afe7dec8efa9fb1c0ec254731f40d7391f4bceaa5eff1384e36b8c1da2c71f','series':s}
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
  IF existing<>p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>9 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>105 THEN RAISE EXCEPTION 'Existing batch differs or incomplete'; END IF;
  RETURN;
 END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  sk:='fi.governors1899.'||(s->>'key');
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series exists %',sk; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,s->>'title',s->>'description',p->>'source_title',p->>'source_url',s->>'unit','Suomen historiallinen alue; lähteen rajaus','annual_or_single_year',(SELECT min((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),(SELECT max((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),'historical_source_observation','curated_context',s->>'theme','historical_context',s->>'description',jsonb_build_object('source_page_checked',true,'include_in_composite',false),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_page',s->>'page','historical_borders',true,'include_in_composite',false),true);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(r->>0)::int,r->>1,r->>2,r->>0,(r->>3)::numeric,r->>3,'observed',CASE WHEN s->>'key'='vaccinations' AND (r->>0)::int=1895 AND r->>1='ABSENT' THEN 'held_for_source_review' ELSE 'source_snapshot_checked' END,s->>'description',NOT (s->>'key'='vaccinations' AND (r->>0)::int=1895 AND r->>1='ABSENT'),p->>'source_url','1899',jsonb_build_object('batch_id',bid,'source_page',s->>'page','source_sha256',p->>'source_sha256','include_in_composite',false,'historical_borders',true) FROM jsonb_array_elements(s->'rows') r;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable')::int,sk,'context','Lähteen historiallinen kuvaileva tieto; ei kausaalivaikutus eikä automaattisen yhdistelmäindeksin syöte.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_url',p->>'source_url','source_sha256',p->>'source_sha256','series',9,'rows',105,'published_values',104,'held_values',1,'caveats',jsonb_build_array('Vuoden 1895 tarkastuksesta pois jääneiden lukumäärä ja prosentti ristiriidassa; lukumäärä odottaa tarkistusta.','Makasiinivarojen kirjanpidollinen ja fyysinen määrä ovat päällekkäisiä.','Köyhäinhoidon suorien kulujen ja laajemman kokonaiskulun rajaukset eroavat.','Maanomistaja voi esiintyä usean kunnan ilmoituksissa.')));
END $load$;
COMMIT;'''
(R/'import.sql').write_text(sql+'\n')
print('9 sarjaa, 105 havaintoa, 1 odottaa:',p['content_sha256'])
