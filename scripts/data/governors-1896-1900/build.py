#!/usr/bin/env python3
"""Page-checked observations from the 1896–1900 economic review."""
import json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parent
def annual(groups):
 return [[y,k,n,v] for k,n,values in groups for y,v in zip(range(1896,1901),values)]
def seq(key,title,unit,theme,variable,page,description,rows):
 return dict(key=key,title=title,unit=unit,theme=theme,variable=variable,page=page,description=description,rows=rows)
s=[
seq('granary_stock','Pitäjänmakasiinien varastot vuoden lopussa','hehtolitraa','Ruokahuolto ja kriisivarautuminen',12,'liitetaulu s. 116–117 / PDF s. 489–490','Kirjanpidollinen varasto ja siitä makasiineissa ollut määrä ovat päällekkäisiä eikä niitä summata; alue on aikakauden Suomi.',annual([('BOOK_RYE','Kirjanpidon ruis',[375465,367566,363639,353955,353735]),('BOOK_BARLEY','Kirjanpidon ohra',[226298,221840,224849,219711,222053]),('BOOK_OATS','Kirjanpidon kaura',[82163,84428,86022,91037,94646]),('PHYSICAL_RYE','Makasiineissa ruis',[275962,272471,254331,190675,182602]),('PHYSICAL_BARLEY','Makasiineissa ohra',[161877,165941,157325,124594,108077]),('PHYSICAL_OATS','Makasiineissa kaura',[63727,61063,62117,51549,58762])])),
seq('vaccinations','Rokotukset ja niiden tarkastus','henkilöä vuodessa','Terveydenhuolto',7,'teksti s. 383 / PDF s. 390','Rokotusvelvolliset ja rokotetut sekä rokotettujen osajoukkoja. Rokotusvelvollisten määrä ei ole aikaisemmissa julkaisuissa käytetty edellisen vuoden syntyneiden vertailuluku.',annual([('ELIGIBLE','Rokotusvelvollisia',[95203,94048,94032,97793,101438]),('TOTAL','Rokotettuja',[67361,68806,70263,71107,74060]),('SUCCESS','Täydellisellä menestyksellä',[57191,61598,62208,66456,69748]),('ABSENT','Pois tarkastuksesta',[3929,3334,3001,2530,2184])])),
seq('poorrelief_forms','Köyhäinhoidon avunsaajat avun muodon ja iän mukaan','henkilöä','Köyhyys ja sosiaaliturva',7,'teksti s. 330 / PDF s. 337','Avun muodon ja iän mukaiset luokat ovat 31.12. läsnä olleet avunsaajat. YEAR_TOTAL on lähteen vuoden lopun summa plus vuoden aikana kuolleet avunsaajat; se ei välttämättä kata kaikkia vuoden aikana apua saaneita. Yli ja alle 15 vuotta ovat lähteen sanamuoto; tasan 15-vuotiaiden käsittely tarkistettava. Avunsaajat eivät kuvaa kaikkia köyhiä.',annual([('INSTITUTION_OVER15','Laitos, yli 15 v',[4875,5121,5179,5575,5666]),('INSTITUTION_UNDER15','Laitos, alle 15 v',[1385,1348,1147,1316,1233]),('BOARD_OVER15','Elätteellä, yli 15 v',[11669,11278,11049,10900,11350]),('BOARD_UNDER15','Elätteellä, alle 15 v',[11041,10399,9673,9138,9570]),('ROTATION_OVER15','Ruotuhoito, yli 15 v',[2172,1931,1576,1449,1239]),('ROTATION_UNDER15','Ruotuhoito, alle 15 v',[898,659,712,751,694]),('REGULAR_OVER15','Säännöllinen apu, yli 15 v',[15626,14762,14111,13824,13991]),('REGULAR_UNDER15','Säännöllinen apu, alle 15 v',[602,418,284,303,224]),('OCCASIONAL_OVER15','Satunnainen apu, yli 15 v',[12901,12000,10771,11467,12723]),('OCCASIONAL_UNDER15','Satunnainen apu, alle 15 v',[354,398,298,289,302]),('YEAR_END_TOTAL','Vuoden lopussa yhteensä',[61523,58314,54800,55012,56992]),('YEAR_TOTAL','Lähteen vuosisumma',[65700,62316,58535,59283,61647])])),
seq('poorrelief_regional_percent','Köyhäinhoidon avunsaajien osuus väestöstä lääneittäin','prosenttia väestöstä','Köyhyys ja sosiaaliturva',7,'teksti s. 333 / PDF s. 340','Lähteen avunsaajien vuosisummaan perustuva osuus, ei kaikkien köyhien osuus. Historialliset läänirajat eivät vastaa nykyisiä alueita.',annual([('UUSIMAA','Uudenmaan lääni',[2.22,2.12,1.88,1.84,1.86]),('TURKU_PORI','Turun ja Porin lääni',[2.41,2.35,2.18,2.19,2.23]),('HAME','Hämeen lääni',[2.49,2.31,2.16,2.14,2.11]),('VIIPURI','Viipurin lääni',[1.60,1.52,1.41,1.35,1.35]),('MIKKELI','Mikkelin lääni',[3.16,2.89,2.81,2.81,2.99]),('KUOPIO','Kuopion lääni',[3.58,3.25,2.94,2.91,3.14]),('VAASA','Vaasan lääni',[2.12,2.05,1.93,2.00,2.07]),('OULU','Oulun lääni',[3.88,3.46,3.16,3.22,3.23]),('FI','Koko maa',[2.57,2.40,2.22,2.22,2.27])])),
seq('poorrelief_finances','Köyhäinhoidon tulot ja menot','nimellistä Suomen markkaa vuodessa','Köyhyys ja sosiaaliturva',7,'teksti s. 334 / PDF s. 341','Tulopuolella ei edellisvuoden säästöä, vuoden lainoja eikä kuntien keskinäisiä saamisia; menoista poistettu vanhoja velkoja ja kuntien väliset korvaukset. Vertailu aiemman sarjan kokonaiskustannuksiin edellyttää tarkistusta; nimellisarvo.',annual([('INCOME','Tulot',[4250499,4206200,4296718,4386590,4551797]),('EXPENSE','Menot',[4062067,3986787,4077545,4259066,4578807])])),
seq('hospital_general','Yleisten sairaaloiden lasarettiosastoilla hoidetut','hoidettuja, lähteen laskentatapa','Terveydenhuolto',7,'teksti s. 382 / PDF s. 389','Lähteen hoidetut eivät välttämättä ole yksilöllisiä henkilöitä; tarkista laitosrajaukset ennen yhdistämistä muihin sarjoihin.',annual([('FI','Koko maa',[8997,9435,9662,9828,9917])])),
seq('hospital_general_days','Yleisten sairaaloiden lasarettiosastojen hoitopäivät','hoitopäivää','Terveydenhuolto',7,'teksti s. 382 / PDF s. 389','Hoitopäivä ei ole henkilö eikä hoitojakso; laitosrajaukset on tarkistettava ennen vertailua.',annual([('FI','Koko maa',[290590,296689,293983,296940,305639])]))
]
assert len(s)==7 and sum(len(x['rows']) for x in s)==175
assert all(s[0]['rows'][15+i][3]<=s[0]['rows'][i][3] for i in range(15))
assert all(sum(s[2]['rows'][5*j+i][3] for j in range(10))==s[2]['rows'][50+i][3] for i in range(5))
assert all(len({(r[0],r[1]) for r in a['rows']})==len(a['rows']) for a in s)
p={'batch_id':'governors_1896_1900_selected_20261027_v1','source_title':'Katsaus Suomen taloudelliseen tilaan 1896–1900 (1904)','source_url':'https://otos.stat.fi/items/b3314e89-09b9-48b5-9df8-6e20c38daffc','source_sha256':'95c3496323bcbf8df53a8df70b68657f5f0a404a8e729dbce5e945ccaab290fc','series':s}
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
  IF existing<>p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>7 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>175 THEN RAISE EXCEPTION 'Existing batch differs or incomplete'; END IF;
  RETURN;
 END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  sk:='fi.governors1904.'||(s->>'key');
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series exists %',sk; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,s->>'title',s->>'description',p->>'source_title',p->>'source_url',s->>'unit','Suomen historiallinen alue; lähteen rajaus','annual_or_single_year',(SELECT min((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),(SELECT max((r->>0)::int) FROM jsonb_array_elements(s->'rows') r),'historical_source_observation','curated_context',s->>'theme','historical_context',s->>'description',jsonb_build_object('source_page_checked',true,'include_in_composite',false),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_page',s->>'page','historical_borders',true,'include_in_composite',false),true);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(r->>0)::int,r->>1,r->>2,r->>0,(r->>3)::numeric,r->>3,'observed','source_snapshot_checked',s->>'description',true,p->>'source_url','1904',jsonb_build_object('batch_id',bid,'source_page',s->>'page','source_sha256',p->>'source_sha256','include_in_composite',false,'historical_borders',true) FROM jsonb_array_elements(s->'rows') r;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable')::int,sk,'context','Lähteen historiallinen kuvaileva tieto; ei kausaalivaikutus eikä automaattisen yhdistelmäindeksin syöte.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_url',p->>'source_url','source_sha256',p->>'source_sha256','series',7,'rows',175,'published_values',175,'held_values',0,'caveats',jsonb_build_array('Makasiinien fyysiset varat sisältyvät kirjanpidollisiin varoihin.','Vuoden lopun avunsaajat ja lähteen vuosisumma eivät ole sama asia.','Köyhäinhoidon avunsaajat eivät edusta kaikkia köyhiä.','Nimelliset rahamäärät ja historialliset aluerajat vaativat tarkistuksen vertailuissa.')));
END $load$;
COMMIT;'''
(R/'import.sql').write_text(sql+'\n')
print('7 sarjaa, 175 havaintoa:',p['content_sha256'])
