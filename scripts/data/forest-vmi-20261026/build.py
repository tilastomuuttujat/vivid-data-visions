"""Luke forest core: retain inventory periods, borders and measurement scopes."""
import collections,decimal,hashlib,json,pathlib,re
R=pathlib.Path(__file__).resolve().parent;S=R/'sources';BATCH='luke_forest_vmi_1918_2025_20261026_v1';D=decimal.Decimal
def sha(b):return hashlib.sha256(b).hexdigest()
def canon(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
SPECS=[
 ('forest_area','area','maaluokka','Metsätalousmaa - Metsämaa','Metsämaan pinta-ala','1000 ha','forest_land_area','forest_land'),
 ('poor_forest_area','area','maaluokka','Metsätalousmaa - Kitumaa','Kitumaan pinta-ala','1000 ha','forest_land_area','poor_forest_land'),
 ('barren_forest_area','area','maaluokka','Metsätalousmaa - Joutomaa','Joutomaan pinta-ala','1000 ha','forest_land_area','unproductive_land'),
 ('roads_area','area','maaluokka','Metsätalousmaa - Metsätiet, varastot ym.','Metsätiet, varastot ja vastaavat alueet','1000 ha','forest_land_area','roads_and_storage'),
 ('forestry_area','area','maaluokka','Metsätalousmaa - Yhteensä','Metsätalousmaan pinta-ala yhteensä','1000 ha','forest_land_area','forestry_land_all_classes'),
 ('growing_stock','stock','puulaji','Koko puusto','Puuston tilavuus metsä- ja kitumaalla','miljoonaa m³','forest_growing_stock','forest_and_poor_forest_land'),
 ('stock_density','density','puulaji','Yhteensä','Puuston keskitilavuus metsämaalla','m³/ha','forest_growing_stock','forest_land'),
 ('growth_inventory','growth','puulaji','Koko puusto','Puuston vuotuinen kasvu metsä- ja kitumaalla, inventointiarvio','miljoonaa m³/vuosi','forest_growth','forest_and_poor_forest_land'),
 ('growth_per_hectare','growth','puulaji','Keskikasvu','Puuston keskikasvu metsä- ja kitumaalla, inventointiarvio','m³/ha/vuosi','forest_growth','forest_and_poor_forest_land'),
 ('removals','annual','MU','POIS','Puuston kokonaispoistuma','miljoonaa m³/vuosi','forest_removals','source_annual_flow_scope'),
 ('harvest','annual','MU','HAKKERT','Hakkuukertymä','miljoonaa m³/vuosi','forest_removals','source_annual_flow_scope'),
]
def read_sources():
 result={}
 for key in ['area','stock','density','growth','annual']:
  rec=json.loads((S/(key+'.receipt.json')).read_text())
  for ext,info in rec['files'].items():assert sha((S/(key+'.'+ext)).read_bytes())==info['sha256']
  m=json.loads((S/(key+'.metadata.json')).read_text());data=json.loads((S/(key+'.response.json')).read_text())
  dims=[c['code'] for c in data['columns'] if c['type']!='c'];labels={v['code']:dict(zip(v['values'],v['valueTexts'])) for v in m['variables']}
  cells=[{'key':dict(zip(dims,r['key'])),'value':r['values'][0]} for r in data['data']]
  result[key]={'receipt':rec,'metadata':m,'labels':labels,'cells':cells,'comments':{c['code']:c['comment'] for c in data['columns'] if c.get('comment')}}
 return result
def numeric(v):
 try:return D(v).is_finite()
 except decimal.InvalidOperation:return False
def geographic(code,label,old_borders):
 group={'1':'FI','1.1':'FI.SOUTH','1.2':'FI.NORTH'}.get(code,'FI.LUKE.'+code)
 level='country' if code=='1' else 'macroregion' if code in ('1.1','1.2') else 'region'
 if old_borders:group+='.BORDERS_PRE1944';label+=' (ennen vuoden 1944 alueluovutuksia)'
 return group,label,level
def build():
 src=read_sources();series=[];flags=[];area=collections.defaultdict(dict)
 for r in src['area']['cells']:
  if numeric(r['value']):area[(r['key']['inventointi'],r['key']['maakunta'])][r['key']['maaluokka']]=D(r['value'])
 bad_area=set()
 for coord,vals in area.items():
  parts=[vals.get('Metsätalousmaa - '+n) for n in ['Metsämaa','Kitumaa','Joutomaa','Metsätiet, varastot ym.']];total=vals.get('Metsätalousmaa - Yhteensä')
  if total is None:continue
  partial=sum(p for p in parts if p is not None)
  if partial>total+3 or (all(p is not None for p in parts) and abs(partial-total)>3):
   bad_area.add(coord);flags.append({'type':'source_area_reconciliation','source_coordinates':coord,'partial_components_sum_1000ha':str(partial),'reported_total_1000ha':str(total),'difference_1000ha':str(partial-total),'action':'retain original values, hold selected area cells at these coordinates; missing roads not treated as zero'})
 for sid,table,dimension,selection,title,unit,cluster,land_scope in SPECS:
  source=src[table];values=[]
  for row in source['cells']:
   k=row['key'];value=row['value']
   if k[dimension]!=selection or not numeric(value):continue
   hold=[];meta={'source_table':table,'source_coordinates':k,'land_scope':land_scope,'include_in_composite':False,'uncertainty_interval':None}
   if table=='annual':
    year=int(k['A']);period=str(year);group='FI';label='KOKO MAA';level='country'
    meta.update({'time_support':'calendar_year_flow','is_inventory_anchor':False,'territorial_basis':'source_annual_table; early border harmonization not explicitly documented'})
    if year<=1944:hold.append('annual_flow_early_border_harmonization_review')
    if 2014<=year<=2023:meta['source_revision_note']='Revised 24.4.2025'
    if year==2024:meta['source_revision_note']='Corrected 14.4.2026; current source response retained'
   else:
    inv=k['inventointi'];period=source['labels']['inventointi'][inv];start,end=map(int,re.search(r'\((\d{4})-(\d{4})\)',period).groups());year=end
    old_borders=table=='growth' and inv in ('01','02a')
    group,label,level=geographic(k['maakunta'],source['labels']['maakunta'][k['maakunta']],old_borders)
    meta.update({'inventory_code':inv,'inventory_label':period,'inventory_start':start,'inventory_end':end,'year_is_display_anchor':True,'is_inventory_anchor':True,'time_support':'inventory_period','territorial_basis':'pre_1944_territory' if old_borders else 'source_published_current_boundary_series','classification_comparable_to_modern':not(table=='area' and inv in ('01','02','03'))})
    if table=='growth':meta.update({'time_support':'five_growing_seasons_before_plot_measurement','growth_is_calendar_year_observation':False,'growth_reference_period_is_inventory_period':False})
    if (inv,k['maakunta']) in bad_area and table=='area':hold.append('source_area_sum_conflict')
    if inv in ('13','14'):
     if k['maakunta']=='1.1.21':meta['measurement_exception']='Ahvenanmaa measured in 2023';meta['measurement_year']=2023
     if k['maakunta'] in ('1','1.2','1.2.19'):meta['measurement_exception']='Includes Upper Lapland measured in 2022; not all plots share identical measurement years'
    if inv=='12' and k['maakunta'] in ('1','1.2','1.2.19'):meta['measurement_exception']='Upper Lapland municipalities Enontekiö, Inari and Utsjoki use VMI11 material within the VMI12 estimate'
   if not 1850<=year<=2025:continue
   meta.update({'geography_level':level,'geography_source_code':k.get('maakunta','1'),'hold_reasons':hold})
   values.append({'year':year,'group_key':group,'group_label':label,'period':period,'value':value,'value_kind':'estimate','is_published':not hold,'meta':meta})
  assert values,sid
  keys=[(v['year'],v['group_key']) for v in values];assert len(keys)==len(set(keys)),sid
  years=[v['year'] for v in values]
  note='Luken alkuperäinen lähdearvio; ei tuonnissa tehtyä interpolointia, yksikkömuunnosta tai ekstrapolointia. Ei kausaalivaikutus, hiilinielu- tai monimuotoisuusmittari. Saman kokonaisuuden osia ei summata erillisiksi vaikutuksiksi.'
  if table!='annual':note+=' Vuosi on inventointijakson loppuvuoden näyttöankkuri, ei kyseisen vuoden yksittäinen mittaus. Jakson alku ja loppu säilyvät. Päällekkäiset inventointijaksot eivät ole riippumattomia havaintoja.'
  if table=='area':note+=' Metsämaa, kitumaa, joutomaa ja metsätalousmaa ovat eri käsitteitä. VMI1–3:n luokitukset eivät täysin vastaa nykyisiä. VMI1 koko maan osasumman ristiriitaiset valitut maaluokkasolut pidätetään julkaisemisesta.'
  if table=='growth':note+=' Kasvu on koealan mittausta edeltävien viiden kasvukauden keskimääräinen vuotuinen kasvu. VMI1 ja VMI2.1 kuvaavat ennen alueluovutuksia ollutta Suomea ja säilyvät erillisillä aluetunnisteilla.'
  if sid=='stock_density':note+=' Tämän keskitilavuuden ala on metsämaa; kokonaispuuston tilavuus kattaa metsä- ja kitumaan. Niitä ei jaeta ristiin saman aluekäsitteen oletuksella.'
  if sid=='removals':note+=' Kokonaispoistuma sisältää käyttöön hakatun runkopuun lisäksi luontaisesti kuollutta ja hakkuissa metsään jäävää runkopuuta. Hakkuukertymä sisältyy kokonaispoistumaan.'
  if table=='annual':note+=' Ennen vuotta 1945 julkaistut virtaluvut säilyvät tarkistettavina, koska varhaisen aluerajauksen yhdenmukaistusta ei ole vahvistettu tässä erässä. Energiapuun tilastointiperusteessa katkos 2008–2015.'
  receipt=source['receipt'];query=json.loads((S/(table+'.query.json')).read_text())
  metadata={'batch_id':BATCH,'source_table':table,'dependency_cluster':cluster,'land_scope':land_scope,'include_in_composite':False,'composite_weight':None,'causal_effect_identified':False,'confidence_intervals_available_in_selected_table':False,'uncertainty_interval':None,'source_file_sha256':receipt['files']['response.json']['sha256'],'metadata_sha256':receipt['files']['metadata.json']['sha256'],'px_sha256':receipt['files']['response.px']['sha256'],'source_retrieved_at':receipt['files']['response.json']['retrieved_at'],'source_metadata':source['metadata'],'source_dimension_comments':source['comments'],'query':query,'selection':{dimension:selection},'group_hierarchy':'Country, South/North macroregions and constituent regions overlap; never sum all group rows. Historical-border growth uses distinct group suffix.','source_values_unchanged':True,'year_anchor_policy':'inventory end year, with original inventory label and start/end metadata' if table!='annual' else 'source calendar year','source_tables_not_automatically_chain_linked':True,'same_year_growth_minus_removals_approved':False,'previous_related_series':['fi.followup20261021.growing_stock_vmi2019_2023'] if sid=='growing_stock' else []}
  if sid=='growing_stock':metadata['related_series_anchor_note']='Existing fi.followup20261021.growing_stock_vmi2019_2023 stores the 2019–2023 inventory at year 2019; this snapshot anchors it at 2023. Same inventory, not two temporal observations or an independent change.'
  series.append({'series_key':'fi.forest.vmi20261026.'+sid,'id':sid,'title':title+' — Luke','unit':unit,'frequency':'inventory_period' if table!='annual' else 'annual','source':'Luonnonvarakeskus, Valtakunnan metsien inventointi' if table!='annual' else 'SVT: Luonnonvarakeskus, Hakkuukertymä ja puuston poistuma','source_url':receipt['url'],'variable_id':10,'start_year':min(years),'end_year':max(years),'description':note,'metadata':metadata,'values':values})
 assert len(series)==11
 p={'batch_id':BATCH,'checked_on':'2026-10-26','year_floor':1850,'year_ceiling':2025,'series':series,'quality_flags':flags,'excluded_source_representations':{'annual.KAS':'Annual table growth index mixes inventory-based estimates; core inventory growth retained instead. Latest source 2020 corresponds to VMI2020–2024, not a 2020 plot observation.','annual.KAS_V':'1918–1934 growth variant has different levels from KAS and unverified boundary/method alignment. Raw source retained, not published or stitched.'},'prior_main_registry_unchanged':'main_metrics_20261026_v1'}
 p['content_sha256']=sha(canon(p).encode());(R/'batch.json').write_text(canon(p)+'\n')
 print(json.dumps({'series':len(series),'values':sum(len(s['values']) for s in series),'published':sum(v['is_published'] for s in series for v in s['values']),'flags':flags},ensure_ascii=False));return p
if __name__=='__main__':build()
