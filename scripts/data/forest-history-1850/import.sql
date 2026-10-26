BEGIN;
DO $forest$
DECLARE
 batch constant text := 'forest_myllyntaus_1850_1920_20261026_v1';
 src constant text := 'https://doi.org/10.1016/S0921-8009(02)00034-4';
 series jsonb := '[{"key":"growth_rate_model_knots","title":"Kasvuosuus: tutkimusmallin oletus","unit":"% puuvarannosta vuodessa","description":"Puuston kasvun mallioletuksen ankkuripisteet; ei mitattuja vuosihavaintoja.","pages":"283–284","rows":[[1870,1.4,"1870"],[1880,1.55,"1880"],[1920,3.4,"1920"]]},{"key":"logging_loss_model_parameter","title":"Hakkuu- ja kuljetushukan mallioletus","unit":"% hakkuista","description":"Oletus 1800–1954; perustuu vuosien 1955–1959 tasoon. Vuosi 1850 on projektin alkua kuvaava jaksoankkuri.","pages":"275","rows":[[1850,11.4,"1800–1954; projektin rajaus alkaa 1850"]]},{"key":"natural_loss_model_knots","title":"Luonnonpoistuman mallioletus","unit":"% kokonaispoistumasta","description":"Mallin oletusarvo, ei vuosittainen havainto. 10 % koski jaksoa 1800–1850, minkä jälkeen osuus pieneni.","pages":"275","rows":[[1850,10,"1800–1850; projektin rajaus alkaa 1850"],[1900,5,"1900"]]},{"key":"reconstructed_stock_trough","title":"Puuston määrän arvioitu vähimmäiskohta","unit":"miljoonaa kiintokuutiometriä","description":"Noin 1 400 miljoonaa m³ noin vuonna 1900. Mallirekonstruktio, ei inventointihavainto; skenaaria ei ole yksilöity.","pages":"284–285","rows":[[1900,1400,"noin 1900"]]}]'::jsonb;
 s jsonb; r jsonb; sk text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(batch));
 IF EXISTS (SELECT 1 FROM public.dataset_meta WHERE id=batch) THEN
   IF (SELECT count(*) FROM public.indicator_series WHERE metadata->>'batch_id'=batch)<>4 OR (SELECT count(*) FROM public.indicator_values WHERE meta->>'batch_id'=batch)<>7 THEN RAISE EXCEPTION 'Incomplete existing batch'; END IF;
   RETURN;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.atlas_variables WHERE id=10) THEN RAISE EXCEPTION 'Missing atlas variable'; END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(series) LOOP
   sk := 'fi.forest.myllyntaus2002.' || (s->>'key');
   IF EXISTS (SELECT 1 FROM public.indicator_series WHERE series_key=sk) THEN RAISE EXCEPTION 'Series already exists: %',sk; END IF;
   INSERT INTO public.indicator_series(series_key,title,description,source,source_url,unit,geography,frequency,start_year,end_year,data_class,status,theme,indicator_role,interpretation,quality,metadata,published)
   VALUES (sk,s->>'title',s->>'description','Myllyntaus & Mattila (2002)',src,s->>'unit','Suomi, tutkimuksen historiallinen aluerajaus','irregular_model_anchors',1850,1920,'historical_reconstruction','held_for_source_review','Luonnonvarat','historical_context',s->>'description',jsonb_build_object('include_in_composite',false,'uncertainty_interval',null,'not_observed',true),jsonb_build_object('batch_id',batch,'source_pages',s->>'pages','source_study_period','1800–1997','project_extraction_period','1850–1920','scenarios','Kolme puunkäyttöskenaariota, eivät luottamusvälit','include_in_composite',false,'territory_note','Tutkimuksen historiallinen aluerajaus; ei suoraan vertailukelpoinen nykyrajojen VMI-lukuihin'),false);
   FOR r IN SELECT value FROM jsonb_array_elements(s->'rows') LOOP
     INSERT INTO public.indicator_values(series_key,year,group_key,group_label,period,value,value_text,value_kind,validation_status,validation_note,is_published,source_url,source_version,meta)
     VALUES(sk,(r->>0)::int,'FI','Tutkimuksen historiallinen aluerajaus',r->>2,(r->>1)::numeric,r->>1,'estimate','held_for_source_review',s->>'description',false,src,'2002',jsonb_build_object('batch_id',batch,'source_pages',s->>'pages','is_model_or_approximate_estimate',true,'not_independent_observation',true,'include_in_composite',false,'hold_reason','Aikajakso ja oletusluonne on esitettävä; tarkat vuosisarjat puuttuvat lähteestä.'));
   END LOOP;
   INSERT INTO public.atlas_variable_indicators(variable_id,series_key,relation_type,rationale) VALUES(10,sk,'context','Historiallinen tutkimus ja mallioletus; ei kausaalinen vaikutus eikä automaattisen yhdistelmäindeksin havainto.');
 END LOOP;
 INSERT INTO public.dataset_meta(id,data) VALUES(batch,jsonb_build_object('source','Myllyntaus & Mattila 2002, Ecological Economics 41, 271–288','source_url',src,'extraction_period','1850–1920','source_period','1800–1997','source_pages','274–276, 283–285','model','Puusto lasketaan inventoinnin lähtöarvosta taaksepäin, käyttäen kasvua ja poistumaa sekä kolmea puunkäyttöskenaariota.','historical_inventory_anchor',jsonb_build_object('period','1921–1924','million_m3',1588,'territory','vanhat aluerajat','not_independent_of_VMI',true),'existing_luke_vmi_anchor',jsonb_build_object('period','1921–1924','million_m3',1385,'territory','nykyrajoihin sovitettu','directly_comparable',false),'turning_point','Noin 1900, noin 1400 miljoonaa m³; likimääräinen malliarvio.','other_context','Puun lämmityskäyttöä arvioitiin muun muassa väestön, lämmitystarpeen, rakennusten ja asumistiheyden perusteella.','limits','Skenaariot eivät ole tilastollisia luottamusvälejä; tarkka vuosittainen puustoaineisto puuttuu artikkelin taulukoista; luontovaikutuksia ei voi päätellä puumäärästä yksin.','published_values',0,'series_count',4,'value_count',7,'include_in_composite',false));
END $forest$;
COMMIT;
