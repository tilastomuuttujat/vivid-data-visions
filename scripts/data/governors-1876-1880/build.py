#!/usr/bin/env python3
"""Selected source transcription and reproducible transactional import."""
import hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parent
years=range(1876,1881)
def annual(groups): return [[y,k,n,v] for k,n,vs in groups for y,v in zip(years,vs) if v is not None]
def one(groups): return [[1880,k,n,v] for k,n,v in groups]
def seq(key,title,unit,theme,variable,page,description,rows,published=True):return dict(key=key,title=title,unit=unit,theme=theme,variable=variable,page=page,description=description,rows=rows,published=published)
s=[]
s.append(seq('grain_trade','Jauhamattoman viljan tuonti ja vienti','tynnyriä','Ruokahuolto ja kauppa',12,'liitetaulu 5, PDF s.106','Jauhamaton vilja; ei sisällä jauhoja. Osat sisältyvät kokonaissummaan, eikä niitä saa lisätä kokonaisuuteen.',annual([
('IMPORT_TOTAL','Tuonti yhteensä',[127481,170196,197415,110377,110397]),('IMPORT_RYE','Rukiin tuonti',[25674,50623,92898,56098,11414]),('IMPORT_BARLEY','Ohran tuonti',[56206,67241,50717,19784,41923]),('IMPORT_OATS','Kauran tuonti',[36899,42629,42713,25067,34990]),('EXPORT_TOTAL','Vienti yhteensä',[141093,148788,176296,328345,417951]),('EXPORT_RYE','Rukiin vienti',[20865,27434,15964,11532,99653]),('EXPORT_BARLEY','Ohran vienti',[332,932,252,81,22487]),('EXPORT_OATS','Kauran vienti',[119815,120338,159958,316652,295646])])))
s.append(seq('flour_trade','Jauhojen ja ryynien tuonti ja vienti','leiviskää','Ruokahuolto ja kauppa',12,'liitetaulu 5, PDF s.106','Jauhot ja ryynit ilmoitetaan painoyksikössä, jauhamattomat jyvät tilavuusyksikössä; niitä ei summata ilman erikseen dokumentoitua muuntoa.',annual([('IMPORT','Tuonti',[10917642,9325009,9404154,9204038,4673715]),('EXPORT','Vienti',[108137,293093,63481,99359,72472])])))
s.append(seq('physicians','Laillisiksi julistetut lääkärit vuoden lopussa','henkilöä','Terveydenhuolto',7,'painettu s.71, PDF s.75','Lähteen laillisiksi julistetut lääkärit; ei nykyinen työssä olevien lääkärien määritelmä.',annual([('FI','Koko maa',[141,142,146,145,155])])))
s.append(seq('pharmacies','Apteekit ja apteekinlaatikot','kappaletta','Terveydenhuolto',7,'painettu s.71, PDF s.75','Lähteen yhteenlaskettu määrä sisältää myös apteekinlaatikot. Kolme erillistä alaryhmää eikä yhteenlaskettua lukua pidä laskea toistensa päälle.',annual([('PERMANENT','Laitoksenomaiset oikeudet',[34,34,34,34,34]),('PERSONAL','Henkilökohtaiset oikeudet',[59,58,58,56,55]),('DEPOT','Apteekinlaatikot',[26,26,26,27,27])])))
s.append(seq('vaccinations','Rokotettujen ja tarkastuksen tietoja','henkilöä','Terveydenhuolto',7,'painettu s.72, PDF s.76','Lähteen rokonpanot sekä osajoukot; ei lasketa kokonaismäärää ja sen osia yhteen. Määritelmien jatkuvuus aiempiin sarjoihin tarkistettava.',annual([('TOTAL','Rokotetut yhteensä',[47742,54437,52930,58045,60301]),('SUCCESS','Puhjenneet rakkulat',[38014,42332,42244,47048,47332]),('ABSENT','Tarkastuksesta pois',[7965,9861,8913,9182,10887])])))
s.append(seq('hospital_general','Yleisten sairashuoneiden lasarettiosastoissa hoidettuja','hoidettuja, lähteen laskentatapa','Terveydenhuolto',7,'painettu s.72, PDF s.76','Hoidettujen määrä ei välttämättä ole eri henkilöiden määrä; laitosluokkien vertailu aiempiin vuosiin on tarkistettava.',annual([('FI','Koko maa',[4975,4803,5062,5226,5660])])))
regions=[('FI','Suomi',105953,1194,9814,54009,40936,61953),('UUS','Uudenmaan lääni',5981,230,704,4178,869,4730),('TUR','Turun ja Porin lääni',11406,248,1908,6685,2565,15143),('HAM','Hämeenlinnan lääni',8132,465,1265,4831,1571,8175),('VII','Viipurin lääni',24401,63,1439,9982,12917,3351),('MIK','Mikkelin lääni',8865,20,230,4994,3621,6393),('KUO','Kuopion lääni',13090,35,1114,7555,4386,7477),('VAA','Vaasan lääni',20315,132,3050,10479,6654,12850),('OUL','Oulun lääni',13763,1,104,5305,8353,3834)]
categories=[('ALL','Maanomistajia yhteensä',2),('OVER200','200 tynnyrinalaa tai enemmän',3),('50_200','50–200 tynnyrinalaa',4),('10_50','10–50 tynnyrinalaa',5),('UNDER10','Alle 10 tynnyrinalaa',6)]
assert all(sum(r[3:7])==r[2] for r in regions)
assert all(sum(r[i] for r in regions[1:])==regions[0][i] for i in range(2,8))
s.append(seq('landowner_size','Maanomistajien viljellyn alan kokoluokat 1880','maanomistajaa, ilmoitusten summa','Maanomistus',2,'liitetaulu 9, PDF s.110','Kuntien ilmoitusten summa; eri kunnissa omistava voi esiintyä useasti. Viljelty maa, ei tilan koko eikä kaikkien viljelijöiden jakauma. Kokonaismäärä sisältää kokoluokat.',one([(a+'_'+k,n+' – '+lab,r[i]) for r in regions for a,n in [(r[0],r[1])] for k,lab,i in categories])))
s.append(seq('tenant_farmers','Torppareiden ilmoitettu määrä 1880','torpparia, ilmoitusten summa','Maanomistus',2,'liitetaulu 9, PDF s.110','Torpparit ovat taulukossa erikseen; ei lasketa maanomistajien kokoluokkiin. Kuntailmoitusten rajaukset.',one([(r[0],r[1],r[7]) for r in regions])))
accounts=[(1877,175784,6,115033,17),(1878,180438,16,98294,1),(1879,186420,17,112767,6),(1880,186644,8,112153,3)]
for name,title,unit,idx in [('granary_rye_book_barrels','Pitäjänmakasiinien rukiin kirjanpidollinen säästö, tynnyrit','tynnyriä',1),('granary_rye_book_kappa','Pitäjänmakasiinien rukiin kirjanpidollinen säästö, kappajäännös','kappaa',2),('granary_rye_physical_barrels','Makasiineissa ollut ruis, tynnyrit','tynnyriä',3),('granary_rye_physical_kappa','Makasiineissa ollut ruis, kappajäännös','kappaa',4)]:
 s.append(seq(name,title,unit,'Ruokahuolto ja kriisivarautuminen',12,'liitetaulu 32, PDF s.193','Koko maan lähdesumma; erilliset tynnyri- ja kappajäännökset. 1 tynnyri = 30 kappaa lähteen mittataulun mukaan. Kirjanpidolliseen säästöön kuuluu myös varastojen ulkopuolella olevia eriä. Vuoden 1879 otsikon tekstintunnistus epäselvä; sarjat pidetty tarkistettavina.',[[a[0],'FI','Koko maa',a[idx]] for a in accounts],False))
p={'batch_id':'governors_1876_1880_food_health_land_20261026_v1','source_url':'https://otos.stat.fi/server/api/core/bitstreams/c7d90bd8-3032-414a-a1ef-ad8032995ac9/content','source_title':'Katsaus Suomenmaan taloudelliseen tilaan 1876–1880 (1884)','source_sha256':'90bb2f11c2205a308ceeb8bbbf3018e50d5289928e4c51c9b723c9a5ccbeb3b6','series':s}
assert len(s)==12 and sum(len(a['rows']) for a in s)==160
assert all(len({(r[0],r[1]) for r in a['rows']})==len(a['rows']) for a in s)
assert all(sum(s[0]['rows'][i+j*5][3] for j in (1,2,3))<=s[0]['rows'][i][3] for i in range(5))
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
  IF existing<>p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>12 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>160 THEN RAISE EXCEPTION 'Existing batch differs or incomplete'; END IF;
  RETURN;
 END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'series') LOOP
  sk:='fi.governors1884.'||(s->>'key');
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series exists %',sk; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,s->>'title',s->>'description',p->>'source_title',p->>'source_url',s->>'unit','Suomen historiallinen alue; lähteen rajaus','annual_or_single_year',1876,1880,'historical_source_observation',CASE WHEN (s->>'published')::bool THEN 'curated_context' ELSE 'held_for_source_review' END,s->>'theme','historical_context',s->>'description',jsonb_build_object('source_page_checked',true,'include_in_composite',false),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_page',s->>'page','existing_source_key','poorrelief_svt1884','historical_borders',true,'include_in_composite',false),(s->>'published')::bool);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(r->>0)::int,r->>1,r->>2,r->>0,(r->>3)::numeric,r->>3,'observed',CASE WHEN (s->>'published')::bool THEN 'source_snapshot_checked' ELSE 'held_for_source_review' END,s->>'description',(s->>'published')::bool,p->>'source_url','1884',jsonb_build_object('batch_id',bid,'source_page',s->>'page','source_sha256',p->>'source_sha256','include_in_composite',false,'historical_borders',true) FROM jsonb_array_elements(s->'rows') r;
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES((s->>'variable')::int,sk,'context','Historiallisen lähteen rajattu kuvaileva tieto; ei itsessään kausaalivaikutus tai automaattinen yhdistelmäindeksin syöte.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_url',p->>'source_url','source_sha256',p->>'source_sha256','existing_source_key','poorrelief_svt1884','series',12,'rows',160,'published_values',144,'held_values',16,'notes',jsonb_build_array('Maanomistaja voi sisältyä usean kunnan ilmoituksiin; torpparit eri luokka.','Kirjanpidolliset varastot ja fyysiset varastot erillisiä; tynnyri = 30 kappaa lähteen mukaan.','Makasiinitaulukon vuosimerkintä epäselvä tekstintunnistuksessa, joten havainnot pidetään tarkistettavina.','Jauhot ja jauhamaton vilja eri mittayksiköissä, kokonaiserät sisältävät erittelyt.','Kirjan alun oikaisut koskevat tekstisivua 44 ja taulua 19, eivät näitä poimintoja.')));
END $load$;
COMMIT;'''
(R/'import.sql').write_text(sql+'\n');print('12 series, 160 observations, 16 held:',p['content_sha256'])
