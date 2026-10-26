import hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parent
p=json.loads((R/'batch.json').read_text())
canonical=json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':'))
p['content_sha256']=hashlib.sha256(canonical.encode()).hexdigest()
payload=json.dumps(p,ensure_ascii=False,separators=(',',':'))
assert '$payload$' not in payload
sql='''BEGIN;
DO $import$
DECLARE p jsonb := $payload$'''+payload+'''$payload$::jsonb; d jsonb; sk text; bid text := p->>'batch_id'; old_hash text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(bid));
 SELECT data->>'content_sha256' INTO old_hash FROM public.dataset_meta WHERE id=bid;
 IF old_hash IS NOT NULL THEN
  IF old_hash <> p->>'content_sha256' OR (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=bid)<>8 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=bid)<>360 THEN RAISE EXCEPTION 'Batch mismatch; new version required'; END IF;
  RETURN;
 END IF;
 IF jsonb_array_length(p->'rows')<>360 OR jsonb_array_length(p->'definitions')<>8 THEN RAISE EXCEPTION 'Invalid batch'; END IF;
 FOR d IN SELECT value FROM jsonb_array_elements(p->'definitions') LOOP
  sk := 'fi.esspros.rahoitus_' || (d->>'key') || '_1980_2024';
  IF EXISTS(SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series exists: %',sk; END IF;
  INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
  VALUES(sk,'Sosiaaliturvan rahoitus: '||(d->>'title'),'THL ESSPROS -taulukon yhteensä-rivin sarake. Käyvät hinnat; 2023 rahoitusrakenne muuttui. Asiakasmaksut ovat erillinen sarake, eivät osa rahoituksen yhteismäärää.','THL – Sosiaaliturvan menot ja rahoitus (2024 aikasarja)',p->>'source_url','milj. EUR (käyvät hinnat)','Finland','annual',1980,2024,'observed','curated_context','Sosiaaliturva ja julkinen talous','historical_context','Rahoittajaluokat kuvaavat tilaston kirjausta, eivät veron lopullista kohtaantoa.',jsonb_build_object('include_in_composite',false,'source_sheet_checked',true),jsonb_build_object('batch_id',bid,'source_sha256',p->>'source_sha256','source_column',(d->>'column')::int,'break_2023','Hyvinvointialueuudistus vaikeuttaa valtion ja kuntien rahoitusosuuksien vertailua','not_independent_of_expense',true,'component_or_total',CASE WHEN d->>'key'='yhteensa' THEN 'total' WHEN d->>'key' in ('rahastosiirto','asiakasmaksut') THEN 'separate_non_component' ELSE 'component' END,'not_causal_attribution',true,'include_in_composite',false),true);
  INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
  SELECT sk,(v->>'year')::int,'FI','Koko maa',(v->>'year'),(v->>'value')::numeric,v->>'value','observed','source_snapshot_checked',v->>'period_note',true,p->>'source_url','2024 workbook',jsonb_build_object('batch_id',bid,'source_sheet',v->>'year','source_cell',v->>'source_cell','source_raw',v->'source_raw','source_rounded',(v->>'source_rounded')::boolean,'source_total_label',v->>'source_label','break_note',v->>'period_note') FROM jsonb_array_elements(p->'rows') v WHERE v->>'key'=d->>'key';
  INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES (17,sk,'context','ESSPROS-rahoituksen tilastollinen erittely; ei sellaisenaan julkisyhteisöjen nettomeno eikä kustannusten lopullinen kohtaanto.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(bid,jsonb_build_object('content_sha256',p->>'content_sha256','source_sha256',p->>'source_sha256','source_url',p->>'source_url','years','1980–2024','series_count',8,'value_count',360,'source_discrepancies',p->'source_discrepancies','warnings',jsonb_build_array('Vuonna 2023 hyvinvointialueiden rahoituksen tilastollinen kirjaus muuttaa valtion ja kuntien luokkia.','Vuoden 2017 kolme tähdellä merkittyä arvoa ovat lähteessä pyöristettyjä ja korjattuja.','Lähteen yhteenlaskuissa pieniä eroja 2014, 2017 ja 2019; alkuperäisarvoja ei korjattu.','Asiakasmaksuja ja rahastosiirtoja ei lisätä rahoittajien summaan.','Käyvät hinnat eivät kuvaa suoraan reaalista kehitystä.','Saman tilaston menot ja rahoitus ovat päällekkäisiä kirjanpidon näkökulmia, eivät erillisiä yhteenlaskettavia menoja.')));
END $import$;
COMMIT;'''
(R/'import.sql').write_text(sql+'\n')
print('SQL bytes',len(sql),'content hash',p['content_sha256'])
