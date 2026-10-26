"""Build an immutable, auditable 35-series supplement, without filling gaps."""
import csv, decimal, hashlib, io, json, pathlib, statistics
R=pathlib.Path(__file__).resolve().parent
BATCH='owid_finland_1850_2025_20261026_v1'
def digest(b): return hashlib.sha256(b).hexdigest()
def canonical(p): return json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':'))
# inventory number, chart, Finnish title, context variable, dependency cluster, CSV/metadata column override
SPECS=[
 (1,'population','Väkiluku',30,'population',None,None),
 (2,'population-density','Väestötiheys',20,'population',None,None),
 (3,'life-expectancy','Elinajanodote syntymähetkellä',7,'survival',None,None),
 (4,'child-mortality','Alle viisivuotiaiden kuolleisuus',7,'child_survival',None,None),
 (5,'maternal-mortality','Äitiyskuolleisuussuhde',7,'maternal_survival',None,None),
 (6,'average-height-of-men','Miesten keskipituus syntymävuoden mukaan',7,'height_men',None,None),
 (7,'average-height-of-women','Naisten keskipituus syntymävuoden mukaan',7,'height_women',None,None),
 (8,'average-height-of-men-for-selected-countries','Miesten keskipituus syntymävuosikymmenen mukaan',7,'height_men',None,None),
 (9,'gdp-per-capita-maddison-project-database','BKT asukasta kohti, Maddison',15,'gdp',None,None),
 (10,'gdp-maddison-project-database','BKT yhteensä, Maddison',15,'gdp',None,None),
 (11,'historical-gov-spending-gdp','Julkiset menot suhteessa BKT:hen, IMF',17,'public_expenditure',None,None),
 (12,'mean-years-of-schooling-long-run','Keskimääräiset koulutusvuodet, 15–64-vuotiaat',4,'education_attainment',None,None),
 (13,'population-having-attained-at-least-basic-education','Muodollista koulutusta saaneiden osuus, 15–64-vuotiaat',4,'education_attainment',None,None),
 (14,'primary-enrollment-selected-countries','Alkeisopetuksen netto-osallistumisaste',4,'school_enrollment',None,None),
 (15,'share-of-the-population-with-completed-tertiary-education','Keskeneräinen korkea-asteen koulutus, 25–64-vuotiaat; määritelmä tarkistettava',4,'education_attainment',None,None),
 (16,'urbanization-last-500-years','Kaupunkialueilla asuvan väestön osuus, HYDE',20,'urbanization',None,None),
 (17,'land-use-over-the-long-term','Viljelysmaan pinta-ala, HYDE',10,'land_use','Cropland','Land use: Cropland'),
 (18,'land-use-over-the-long-term','Laidunmaan pinta-ala, HYDE',10,'land_use','Grazing','Land use: Grazingland'),
 (19,'land-use-over-the-long-term','Rakennetun alueen pinta-ala, HYDE; yksikkö tarkistettava',20,'land_use','Built-up Area','Land use: Built-up area'),
 (20,'suffrage','Äänioikeutettujen osuus aikuisista kansalaisista',19,'vdem_political_rights',None,None),
 (21,'electoral-democracy','Vaalidemokratiaindeksi',8,'vdem_democracy',None,None),
 (22,'liberal-democracy','Liberaalin demokratian indeksi',8,'vdem_democracy',None,None),
 (23,'political-regime','Poliittisen järjestelmän luokitus',8,'vdem_democracy',None,None),
 (24,'civil-liberties','Ihmisoikeuksien indeksi (civil-liberties)',19,'vdem_civil_rights',None,None),
 (25,'freedom-of-expression','Sananvapausindeksi',29,'vdem_civil_rights',None,None),
 (26,'freedom-of-association','Yhdistymisvapausindeksi',21,'vdem_civil_rights',None,None),
 (27,'women-civil-liberties-index','Naisten kansalaisoikeuksien indeksi',19,'vdem_civil_rights',None,None),
 (28,'political-corruption-index','Poliittisen korruption indeksi',22,'vdem_corruption',None,None),
 (29,'public-sector-corruption-index','Julkisen sektorin korruption indeksi',8,'vdem_corruption',None,None),
 (30,'annual-co2-emissions-per-country','Alueperusteiset CO₂-päästöt',9,'territorial_co2',None,None),
 (31,'annual-co2-coal','Kivihiilen CO₂-päästöt',9,'territorial_co2',None,None),
 (32,'annual-co2-oil','Öljyn CO₂-päästöt',9,'territorial_co2',None,None),
 (33,'annual-co2-gas','Maakaasun CO₂-päästöt',9,'territorial_co2',None,None),
 (34,'cumulative-co-emissions','Kumulatiiviset alueperusteiset CO₂-päästöt',9,'territorial_co2',None,None),
 (35,'share-of-cumulative-co2','Suomen osuus maailman kumulatiivisista CO₂-päästöistä',9,'territorial_co2',None,None),
]
def build():
    series=[]
    for n,slug,title,var,cluster,col,metacol in SPECS:
        base=R/'sources'; raw=(base/(slug+'.csv')).read_bytes();meta_raw=(base/(slug+'.metadata.json')).read_bytes()
        receipt=json.loads((base/(slug+'.receipt.json')).read_text())
        assert digest(raw)==receipt['files']['csv']['stored_sha256']
        assert digest(meta_raw)==receipt['files']['metadata.json']['stored_sha256']
        meta=json.loads(meta_raw);reader=csv.DictReader(io.StringIO(raw.decode()))
        candidates=[k for k in reader.fieldnames if k not in ('Entity','Code','Year','World region according to OWID') and not k.endswith('(Annotations)')]
        if col is None:
            assert len(candidates)==1,(slug,candidates)
            col=candidates[0]
        mc={k:v for k,v in meta['columns'].items() if v.get('owidVariableId') and 'World region' not in k and not k.endswith('-annotations')}
        if metacol is None:
            assert len(mc)==1,(slug,list(mc))
            metacol=next(iter(mc))
        m=mc[metacol];rows=list(reader)
        historic=[int(r['Year']) for r in rows if r[col] and 1800<=int(r['Year'])<=1899]
        assert historic,slug
        notes=['OWID-lähdeversio; kansallisia sarjoja ei korvata. Ei syyvaikutusarvio eikä kokonaisindeksin paino. Historiallisten lähteiden ja menetelmien vaihtuminen voi aiheuttaa katkoksia.']
        if n in (1,2,16,17,18,19):notes.append('Aluerajaus ja historiallinen rekonstruktio on huomioitava; nykyisten rajojen sarja ei ole sellaisenaan historiallisten hallinnollisten alueiden tilasto.')
        if n in (6,7,8):notes.append('Vuosi tarkoittaa syntymäkohorttia, ei kalenterivuoden väestön keskipituutta. Ei vuotuista interpolointia.')
        if n==11:notes.append('Keskushallinnon ja julkisyhteisöjen kattavuus voi vaihdella; sektorikatkokset eivät osoita menopolitiikan muutosta sellaisenaan.')
        if 20<=n<=29:notes.append('Asiantuntija-arvio/luokitus. Suomen itsenäisyyttä edeltäviä emävaltiosta siirrettyjä ja Suomea koskevia arvoja ei erotella rivitasolla tässä lähteessä: kaikki vuodet 1850–1917 pidätetään julkaisemisesta.')
        if n==15:notes.append('Sivuotsikon completed tertiary ja sarakkeen incomplete tertiary välillä ristiriita. Raaka-arvot säilytetään, mutta koko sarja pidätetään julkaisemisesta.')
        if n==16:notes.append('HYDE-kaupunkialue ei vastaa suoraan Suomen historiallista kaupunkiväestöä. Julkaisu pidätetty, kunnes määritelmä ja Suomen poikkeava historiallinen taso on validoitu.')
        if n==19:notes.append('Metadata ilmoittaa km² per grid cell, vaikka ladattu sarja on maakohtainen aggregaatti. Raakayksikkö säilyy muuttamatta. Julkaisu pidätetty yksikkövalidointiin asti.')
        if n==23:notes.append('Luokkakoodi, ei jatkuva määrä. Ei käyrän tasoitusta, keskiarvoa eikä summavaikutusta.')
        vals=[]
        for r in rows:
            y=int(r['Year']);v=r[col]
            if not(1850<=y<=2025) or v=='':continue
            assert r['Code']=='FIN' and decimal.Decimal(v).is_finite()
            kind='estimate';state='historical_estimate';hold=[]
            if n in (12,13,15) and y>=2015:kind='projection';state='projection';hold.append('schooling_projection_from_2015')
            if n==2 and y>=2024:kind='projection';state='projection';hold.append('population_projection_from_2024')
            if 20<=n<=29 and y<=1917:hold.append('pre_independence_entity_provenance_review')
            if n==15:hold.append('tertiary_definition_conflict')
            if n==16:hold.append('urban_definition_validation')
            if n==19:hold.append('built_up_unit_validation')
            annotations={k:r[k] for k in reader.fieldnames if k.endswith('(Annotations)') and r[k]}
            vals.append({'year':y,'value':v,'value_kind':kind,'temporal_status':state,'is_published':not hold,'hold_reasons':hold,'annotations':annotations})
        assert vals,slug
        years=[v['year'] for v in vals];assert len(years)==len(set(years))
        steps=[b-a for a,b in zip(years,years[1:])]
        if n==8:frequency='birth_decade'
        elif n in (6,7):frequency='birth_cohort_year'
        elif steps and all(s==1 for s in steps):frequency='annual'
        else:frequency='irregular_source_years'
        key=f'owid.finland.{slug}'+({17:'.cropland',18:'.grazing',19:'.built_up'}.get(n,''))+'.v20261026'
        series.append({'inventory_number':n,'series_key':key,'slug':slug,'title':title+' — OWID','source':m.get('citationShort') or meta['chart'].get('citation','Our World in Data'),'source_url':f'https://ourworldindata.org/grapher/{slug}', 'csv_column':col,'metadata_column':metacol,'variable_id':var,'unit':m.get('unit') or ('category_code' if n==23 else 'index (source scale)'),'frequency':frequency,'start_year':min(years),'end_year':max(years),'description':' '.join(notes),'metadata':{'batch_id':BATCH,'inventory_number':n,'dependency_cluster':cluster,'include_in_composite':False,'composite_weight':None,'causal_effect_identified':False,'measurement_scale':'nominal' if n==23 else 'numeric','source_first_year_in_1800s':min(historic),'snapshot_csv_sha256':digest(raw),'snapshot_metadata_sha256':digest(meta_raw),'hash_scope':'Finland CSV subset retaining all available source years; original numeric strings','source_retrieved_at':receipt['retrieved_at'],'source_last_updated':m.get('lastUpdated'),'owid_variable_id':m.get('owidVariableId'),'source_citation':m.get('citationLong'),'source_column_metadata':m,'chart_metadata':meta['chart'],'csv_request':receipt['requests']['csv'],'metadata_request':receipt['requests']['metadata.json'],'missing_years':[y for y in range(min(years),max(years)+1) if y not in years],'interpolation_performed':False,'numeric_conversion_performed':False,'uncertainty_interval':None,'national_series_replaced':False},'values':vals})
    assert len(series)==35 and len({s['series_key'] for s in series})==35
    p={'batch_id':BATCH,'retrieval_date':'2026-10-26','year_min':1850,'year_max':2025,'scope':'The 35 representations listed in the preceding inventory; not every chart in the OWID catalog.','main_registry_unchanged':'main_metrics_20261026_v1','historical_registry_unchanged':'historical_metrics_1850_1899_20261026_v1','series':series}
    p['content_sha256']=digest(canonical(p).encode())
    (R/'batch.json').write_text(canonical(p)+'\n')
    print(json.dumps({'series':len(series),'values':sum(len(s['values']) for s in series),'published':sum(v['is_published'] for s in series for v in s['values'])}))
    return p
if __name__=='__main__':build()
