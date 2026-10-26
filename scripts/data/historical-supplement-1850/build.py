"""Build additions with explicit units, source dependencies and gap preservation."""
import csv,decimal,hashlib,io,json,pathlib
R=pathlib.Path(__file__).resolve().parent;BATCH='historical_finance_prices_1850_20261026_v1'
DEC=decimal.Decimal
def canon(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def sha(b):return hashlib.sha256(b).hexdigest()
# Variable, Finnish title, native unit, context variable, dependency cluster.
SPECS=[
 ('rconsbarro','Reaalikulutus asukasta kohti','indeksi, 2006=100',18,'consumption'),
 ('iy','Investointien suhde BKT:hen','suhdeluku (1 = 100 %)',15,'investment'),
 ('ca','Vaihtotase','miljoonaa uutta Suomen markkaa, nimellinen',13,'external_balance'),
 ('narrowm','Suppea rahamäärä','miljoonaa uutta Suomen markkaa, nimellinen',17,'money'),
 ('money','Lavea rahamäärä','miljoonaa uutta Suomen markkaa, nimellinen',17,'money'),
 ('stir','Lyhyt nimelliskorko','% vuodessa',17,'interest_rates'),
 ('ltrate','Pitkä nimelliskorko','% vuodessa',17,'interest_rates'),
 ('wage','Nimellispalkkaindeksi','indeksi, 1990=100',15,'wages'),
 ('revenue','Julkisen sektorin tulot, historiallinen kattavuus','miljoonaa uutta Suomen markkaa, nimellinen',17,'fiscal'),
 ('expenditure','Julkisen sektorin menot, historiallinen kattavuus','miljoonaa uutta Suomen markkaa, nimellinen',17,'fiscal'),
 ('xrusd','Yhdysvaltain dollarin vaihtokurssi','uutta Suomen markkaa / USD',13,'exchange_rate'),
 ('tloans','Luotot yksityiselle ei-rahoitussektorille','miljoonaa uutta Suomen markkaa, nimellinen',17,'private_credit'),
 ('lev','Pankkien pääoma suhteessa taseen varoihin','%',17,'bank_funding'),
 ('ltd','Pankkien luotot suhteessa talletuksiin','%',17,'bank_funding'),
 ('noncore','Pankkien muun kuin talletusrahoituksen osuus','%',17,'bank_funding'),
 ('crisisJST','Systeemisen finanssikriisin vuosiluokitus','luokkakoodi 0/1',17,'financial_crisis'),
 ('peg','Valuuttakurssin kiinnityksen luokitus','luokkakoodi 0/1',13,'exchange_regime'),
 ('peg_strict','Tiukan valuuttakurssikiinnityksen luokitus','luokkakoodi 0/1',13,'exchange_regime'),
 ('eq_tr','Osakkeiden nimellinen kokonaistuotto','vuosituoton suhdeluku (1 = 100 %)',2,'asset_returns'),
 ('bond_tr','Valtion pitkien velkapaperien nimellinen kokonaistuotto','vuosituoton suhdeluku (1 = 100 %)',2,'asset_returns'),
 ('bill_rate','Lyhyen sijoituksen nimellinen korkotuotto, historialliset korvikkeet','vuosituoton suhdeluku (1 = 100 %)',2,'asset_returns'),
 ('bond_rate','Pitkien velkapaperien korkotuotto','vuosituoton suhdeluku (1 = 100 %)',2,'asset_returns'),
 ('safe_tr','Turvallisiksi luokiteltujen sijoitusten laskennallinen kokonaistuotto','vuosituoton suhdeluku (1 = 100 %)',2,'asset_returns'),
]
def build():
 m=json.loads((R/'sources/manifest.json').read_text());ss=[]
 for name,src in m.items():assert sha((R/'sources'/src['subset']).read_bytes())==src['subset_sha256'],name
 rows=list(csv.DictReader(io.StringIO((R/'sources/jst-finland.csv').read_text())));data={int(r['year']):r for r in rows}
 def add(key,title,unit,var,cluster,src,vals,note,**extra):
  vals=sorted(vals,key=lambda x:x['year']);assert vals and len(vals)==len({v['year'] for v in vals})
  for v in vals:assert 1850<=v['year']<=2025 and DEC(v['value']).is_finite()
  years=[v['year'] for v in vals]
  metadata={'batch_id':BATCH,'source_snapshot':src,'dependency_cluster':cluster,'include_in_composite':False,'composite_weight':None,'causal_effect_identified':False,'uncertainty_interval':None,'national_series_replaced':False,'source_file_sha256':m[src]['subset_sha256'],'source_retrieved_at':m[src]['retrieved_at'],'source_version':'JST R6' if src=='jst' else 'StatFin 11xy, retrieved 2026-10-26' if src=='cpi' else 'Suomen tilastollinen vuosikirja 2025, 9.21','source_documentation_url':m[src].get('documentation_url'),'source_original_sha256':m[src]['source_sha256'],'missing_years':[y for y in range(min(years),max(years)+1) if y not in years],'interpolation_by_import':False,'source_license':m[src].get('license'),'source_citations':{k:v for k,v in m[src].items() if 'citation' in k},**extra}
  ss.append({'series_key':f'fi.historical20261026.{key}','title':title,'unit':unit,'variable_id':var,'source':'Jordà–Schularick–Taylor Macrohistory Database R6' if src=='jst' else m[src]['source'],'source_url':m[src]['source_url'],'start_year':min(years),'end_year':max(years),'description':note,'frequency':'annual' if all(b-a==1 for a,b in zip(years,years[1:])) else 'irregular_source_years','metadata':metadata,'values':vals})
 for code,title,unit,var,cluster in SPECS:
  vals=[{'year':y,'value':r[code],'value_kind':'estimate','is_published':True,'meta':{'source_variable':code,'source_method':'historical_compilation','breakpoint_eligible':not(code=='lev' and y in (1990,1991)),'source_interpolated':code=='lev' and y in (1990,1991)}} for y,r in data.items() if r[code] and 1850<=y<=2025]
  assert min(v['year'] for v in vals)<1900,code
  note='Historiallinen lähdekooste ja ketjutettuja lähdejaksoja; ei uusi riippumaton todiste kansallisten lähteiden rinnalla. Aukkoja ei täytetä eikä sarjoja jatketa nykyhetkeen. Ei kokonaisindeksin painoa tai syyvaikutusta.'
  breaks=[]
  if code in ('narrowm','money'):note+=' Rahamäärän määritelmä ja instituutiokattavuus muuttuvat. Euroajan luvut ovat lähteessä muunnettuja markkamääräisiä vastineita, eivät liikkeessä olevia markkoja.'
  if code in ('revenue','expenditure'):note+=' Historialliset valtion/julkisen sektorin rajaukset eivät vastaa koko jaksolla nykyistä S13-julkisyhteisösektoria.'
  if code=='wage':note+=' Varhainen osa kuvaa teollisuuden palkkoja, vuodesta 1990 OECD:n keskimääräisiä vuosipalkkoja. Ei yhden muuttumattoman työntekijäryhmän palkkakehitys.';breaks=[1948,1990]
  if code=='lev':note+=' Pääoma/taseen varat; EI Basel-vakavaraisuussuhde riskipainotettuihin saamisiin. Vuodet 1990–1991 lähteen interpoloimia: eivät kelpaa murroksen ajoittamiseen.';breaks=[1904,1990,1992,2014]
  if code in ('ltd','noncore'):note+=' Pankki- ja maantieteellinen kattavuus vaihtuu. Kyse on lähteen tase-erien suhteesta, ei itsenäisesti tunnistetusta kriisivaikutuksesta.';breaks=[1904,2014]
  if code=='noncore':note+=' Kaava: (varat − pääoma − talletukset) / (varat − pääoma), prosentteina.'
  if code in ('crisisJST','peg','peg_strict'):note+=' Luokitus 0/1 ei ole kriisin vakavuuden tai politiikan vaikutuksen jatkuva mittari.'
  if code=='bill_rate':note+=' Varhaisessa aineistossa lyhyen valtionpaperin sijaan voidaan käyttää pankin talletus- tai muuta lyhyttä korkoa; ei kaikilta vuosilta saman instrumentin tuotto.'
  if code=='safe_tr':note+=' Lähteen yhdistelmä: pitkän velkapaperin kokonaistuoton ja lyhyen koron yksinkertainen keskiarvo; luokitus ei takaa riskittömyyttä.'
  if code in ('stir','ltrate','bond_rate'):note+=' Lyhyiden ja pitkien korkojen instrumentit ja ajoitus muuttuvat lähdejaksoittain. bond_rate on suhdeluku, stir/ltrate ovat prosentteja.'
  add('jst.'+code,title+' — JST R6',unit,var,cluster,'jst',vals,note,source_variable=code,measurement_scale='binary_category' if code in ('crisisJST','peg','peg_strict') else 'numeric',definition_break_years=breaks,documentation_pages='JST R6, printed pp. 62–70; returns: RORE documentation',upstream_compilation_may_interpolate=True)
 # Explicit derived ratios use compatible nominal source units and do not add weights.
 derived=[('credit_gdp','Yksityisen ei-rahoitussektorin luotot / BKT','tloans',17,'private_credit'),('broad_money_gdp','Lavea rahamäärä / BKT','money',17,'money'),('current_account_gdp','Vaihtotase / BKT','ca',13,'external_balance'),('revenue_gdp','Historialliset julkiset tulot / BKT','revenue',17,'fiscal'),('expenditure_gdp','Historialliset julkiset menot / BKT','expenditure',17,'fiscal')]
 for key,title,col,var,cluster in derived:
  vals=[{'year':y,'value':str(DEC(r[col])/DEC(r['gdp'])*100),'value_kind':'estimate','is_published':True,'meta':{'numerator_variable':col,'denominator_variable':'gdp','formula':f'100 * {col} / gdp'}} for y,r in data.items() if r[col] and r['gdp'] and DEC(r['gdp'])>0 and 1850<=y<=2025]
  add('jst.'+key,title+' — laskettu JST R6:sta','% BKT:sta',var,cluster,'jst',vals,'Johdettu saman JST-version yhteismitallisista nimellismääristä. Kanta/virta-suhde luotoissa ja rahamäärässä; ei BKT:n osatekijä tai summattava vaikutus. Julkisen sektorin historiallinen rajaus vaihtelee. Ei interpolointia tai kausaalista tulkintaa.',formula=f'100 * {col} / gdp',inputs=[col,'gdp'],calculation_type='derived_ratio')
 vals=[{'year':y,'value':str(DEC(r['wage'])/DEC(r['cpi'])*100),'value_kind':'estimate','is_published':True,'meta':{'formula':'100 * wage / cpi','source_definition_break':y in (1948,1990)}} for y,r in data.items() if r['wage'] and r['cpi'] and DEC(r['cpi'])>0]
 add('jst.real_wage_index','Reaalipalkkaindeksi — laskettu JST R6:sta','indeksi, 1990=100',15,'wages','jst',vals,'Nimellispalkkaindeksi jaettu saman lähteen kuluttajahintaindeksillä ja kerrottu sadalla. Teollisuuspalkoista keskimääräisiin vuosipalkkoihin vaihtuva ketju, ei kotitalouden käytettävissä oleva tulo eikä muuttumaton palkansaajaryhmä. Määritelmäkatkokset säilyvät.',formula='100 * wage / cpi',inputs=['wage','cpi'],definition_break_years=[1948,1990],calculation_type='derived_index')
 cpi=json.loads((R/'sources/cpi-response.json').read_text())
 vals=[{'year':int(r['key'][0]),'value':r['values'][0],'value_kind':'estimate','is_published':True,'meta':{'source_value_kind':'official_historical_index','classification_note':'Conservative import class; not asserted to be independently observed each year'}} for r in cpi['data'] if r['values'][0] not in ('','.','..','...')]
 add('statfin11xy.cpi1914','Elinkustannusindeksi (1914:1–6=100) — StatFin 11xy','indeksipisteluku, 1914:1–6=100',18,'consumer_prices','cpi',vals,'Pitkä kansallinen hintaindeksi. Eri perusvuoden indeksejä ei summata; deflatoinnissa käytetään vuosien indeksisuhdetta. Alkuperäinen pisteluku säilyy, eikä sarjaa ketjuteta aiempaan 1951-perusvuoden sarjaan automaattisesti.',query=m['cpi']['query'])
 wood=json.loads((R/'sources/wood-extract.json').read_text())
 for col,title in [('domestic','Metsäteollisuuden kotimaisen raakapuun käyttö'),('energy','Raakapuun käyttö energiantuotannossa')]:
  vals=[{'year':r['year'],'value':r[col],'value_kind':'estimate','is_published':True,'meta':{'sheet':'Taul1','sheet_row':r['sheet_row'],'source_column':'B' if col=='domestic' else 'D','source_definition_break':col=='energy' and r['year']==1993}} for r in wood['records'] if r[col] not in (None,'','-','.','..','...')]
  add('luke.roundwood_'+col,title+' — Luke/vuosikirja 2025','miljoonaa m³',10,'roundwood','wood',vals,wood['footnote_summary']+' Puunkäyttömäärä ei ole päästö-, hiilinielu- tai kestävyyden kokonaismittari. Puuttuvia tai viivalla merkittyjä lukuja ei tulkita nolliksi.',source_column=col,definition_break_years=[1993] if col=='energy' else [])
 assert len(ss)==32 and len({s['series_key'] for s in ss})==32
 p={'batch_id':BATCH,'captured_on':'2026-10-26','year_floor':1850,'year_ceiling':2025,'series':ss,'policy':'Insert-only source versions and explicit derivatives; no new composite weights or causal edges.','main_registry_unchanged':'main_metrics_20261026_v1'}
 p['content_sha256']=sha(canon(p).encode());(R/'batch.json').write_text(canon(p)+'\n')
 print(json.dumps({'series':len(ss),'values':sum(len(s['values']) for s in ss),'first_year':min(s['start_year'] for s in ss),'last_year':max(s['end_year'] for s in ss)}));return p
if __name__=='__main__':build()
