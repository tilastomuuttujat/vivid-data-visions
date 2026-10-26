"""Build a bounded descriptive-use approval registry, not composite weights."""
import hashlib,json,pathlib,math
R=pathlib.Path(__file__).resolve().parent;O=R.parents[2]/'docs/data-readiness'
def read(n):return json.loads((R/n).read_text())
specs=read('main-metric-specs.json');values=read('main-metric-values.json');catalog={x['series_key']:x for x in read('main-metric-catalog.json')};checks=read('approval-source-comparison.json');income=read('approval-income-check.json')
assert income['passed'] and income['checked']==51
assert len(checks)==3 and all(x['checked']==x['matches'] and not x['mismatches'] for x in checks)
notes={
'gdp_pc':('Tuotannon reaalinen määrä asukasta kohden','ei suoraan hyvinvointia; historiallinen rekonstruktio ja tilinpitokatkokset 1960/1975; vuosikerta säilytetään','production_income'),
'employment':('15–64-vuotiaiden työllisyysaste','Vuoden 2021 menetelmä; vain tallennetut vuodet, ei ketjutusta aiempaan menetelmään. Vuoden 2025 työllisten lukumäärän lähderistiriitaa ei ratkaista tällä prosenttisarjalla.','labour_rates'),
'unemployment':('15–74-vuotiaiden työttömyysaste','Nimittäjänä työvoima; ei työllisyysasteen komplementti. Vuoden 2021 menetelmä.','labour_rates'),
'real_income':('Kotitalouksien reaalinen käytettävissä oleva nettotulo asukasta kohti','S14-keskiarvo ei mediaani eikä jakauma. Vuoden 2025 hintataso; 2024–2025 ennakollisuus säilytetään.','production_income'),
'gini':('Käytettävissä olevien rahatulojen Gini','Vain kolme tallennettua havaintopistettä tässä lähdeversiossa; älä ketjuta toista Gini-vuosikertaa automaattisesti. Ei varallisuuserojen mittari.','income_distribution'),
'public_debt':('Julkisyhteisöjen sulautettu bruttovelka / BKT','Ei valtionvelka, vaikka alkuperäinen avain on valtionvelka_bktsta. Brutto- ja nettovelka erotettava. Ei yksiselitteistä hyvää suuntaa.','public_finance'),
'public_spending':('Julkisyhteisöjen kokonaismenot / BKT','Menojen osuus ei palvelujen laatu tai vaikuttavuus; ei yksiselitteistä hyvää suuntaa. Sama BKT-nimittäjä velkasuhteen kanssa.','public_finance'),
'life_male':('Vastasyntyneen elinajanodote, miehet','Periodielinajanodote, ei syntymäkohortin toteutunut elinikä. Ennen vuotta 1971 lähteen monivuotiset jaksot, ei yksittäisiä vuosihavaintoja.','longevity'),
'life_female':('Vastasyntyneen elinajanodote, naiset','Sama periodikäsitteen rajoitus kuin miehillä. Sukupuolisarjoista ei lasketa koko väestön lukua ilman oikeaa menetelmää.','longevity'),
'infant_mortality':('Imeväiskuolleisuus, kaikki sukupuolet','Alle yksivuotiaiden kuolemat suhteessa elävänä syntyneisiin. Ei kuolleiden määrä eikä promilleosuus koko väestöstä. Historiallinen tilastokattavuus huomioitava.','mortality'),
'fertility':('Kokonaishedelmällisyysluku','Periodimittari ei toteutunut lopullinen lapsiluku eikä yhteiskunnan onnistumispiste. Puuttuvat vuodet säilyvät.','demography'),
'overcrowding':('Ahtaasti asuvien henkilöiden osuus','Enemmän kuin yksi henkilö huonetta kohti, keittiö pois lukien. Ei asuntokuntien osuus. Harvat julkaistut vertailuvuodet.','housing'),
'homelessness':('Yksinelävät asunnottomat, kuntakysely','Manner-Suomi; yleensä 15.11. poikkileikkaus ja vaihtuva vastauskattavuus. Helsingin tilastointikatkos 2018: ei vertailua tai jatkuvaa viivaa katkoksen yli. Ei koko asunnottomuuden määrä.','housing'),
'ghg':('Kasvihuonekaasupäästöt ilman maankäyttösektoria','Sama vuoden 2025 inventaarioversio; 1991–1999 puuttuvat. Ei kulutusperusteinen hiilijalanjälki eikä kaikkien ympäristövaikutusten summa.','environment'),
'energy':('Energian kokonaiskulutus','Neljä vertailuvuotta 2021–2024, 2024 ennakkotieto. Primäärienergia TJ, ei sähköntuotanto. Suunta ei yksiselitteisesti hyvä/huono.','environment'),
 'turnout_parliament':('Eduskuntavaalien äänestysaktiivisuus, vuosikirjan nimittäjä','Vain vaalivuodet; nimittäjäkatkos 1975 (ulkomailla asuvat mukana). Älä ketjuta Suomessa asuvien sarjaan. Ei demokratian kokonaisindeksi.','electoral_participation'),
 'turnout_municipal':('Kuntavaalien äänestysaktiivisuus','Vain vaalivuodet; äänioikeuden ehdot ja äänioikeutettujen joukko muuttuneet. Ei samojen yksilöiden osallistumispolku.','electoral_participation'),
 'prison_population':('Vankimäärä 31.12., kaikki lähteen vangit','Kontrollijärjestelmän varanto, ei rikollisuusaste tai turvallisuuden paraneminen. Ei väestöön suhteutettu; ei kaikkien leirien ja sotavankien kokonaismäärä.','criminal_justice')}
GROUPS={k:('FI_HIST' if k in ('employment','unemployment') else 'total' if k in ('overcrowding','ghg','energy','turnout_parliament','turnout_municipal') else 'FI') for k,b,s in specs if k in notes}
approved=[];held=[]
verified_keys={x['series_key'] for x in checks}
for key,block,series in specs:
 s=catalog[series];m=s.get('metadata') or {}
 if m.get('publication_hold'):
  held.append(dict(metric_id=key,series_key=series,status='not_approved',reason='publication_hold; ESS weighted means, valid-value exclusions and rounds have not been reproduced',block=block));continue
 assert key in notes
 selected=[];excluded=[]
 for v in values:
  if v['series_key']!=series:continue
  reason=None
  if v['group_key']!=GROUPS[key]:reason='wrong_group'
  elif not 1850<=v['year']<=2025:reason='outside_history_scope'
  elif v['value'] is None or not math.isfinite(float(v['value'])):reason='no_finite_value'
  elif not v['is_published'] and series not in verified_keys:reason='unpublished'
  elif v['value_kind'] not in ('observed','estimate'):reason='not_historical_observation'
  elif not str(v['source_url'] or '').startswith(('http://','https://')):reason='missing_source_url'
  elif key=='real_income' and v['validation_status']!='calculation_checked':reason='unchecked_derivation'
  elif series not in verified_keys and key!='real_income' and v['validation_status'] not in ('source_verified','source_snapshot_checked'):reason='not_source_checked'
  if reason:excluded.append({'year':v['year'],'reason':reason});continue
  selected.append(v)
 assert selected,key
 cells=[dict(year=v['year'],period=v['period'] or (m.get('period_labels') or {}).get(str(v['year'])) or str(v['year']),value=float(v['value']),source_url=v['source_url'],source_version=v['source_version'],original_validation_status=v['validation_status']) for v in selected]
 years=sorted({v['year'] for v in selected});breaks={'gdp_pc':[1960,1975],'homelessness':[2018],'turnout_parliament':[1975]}.get(key,[])
 name,limit,cluster=notes[key]
 evidence='fresh_source_cell_comparison' if series in verified_keys else 'stored_inputs_recomputed' if key=='real_income' else 'existing_source_checked_snapshot_with_definition_review'
 approved.append(dict(metric_id=key,series_key=series,block=block,title=name,status='approved_descriptive_use',group_key=GROUPS[key],unit=s['unit'],geography=s['geography'],approved_years=years,coverage={'first':min(years),'last':max(years),'points':len(cells),'missing_years_within_span':[y for y in range(min(years),max(years)+1) if y not in years]},cells=cells,break_years=breaks,dependency_cluster=cluster,source_url=s['source_url'],definition_and_limits=limit,evidence_basis=evidence,do_not_interpolate=True,period_labels_required=True,causal_effect_approved=False,composite_approved=False,weight=None,normalization=None,excluded_cells=excluded))
assert 15<=len(approved)<=25 and len({a['metric_id'] for a in approved})==len(approved)
manifest={'registry_id':'main_metrics_20261026_v1','approved_on':'2026-10-26','basis_audit':'calculation_readiness_20261026_v1','scope':'Named national or explicitly mainland descriptive series and stored historical cells only. Not approval of a nine-block composite or causal effects.','approved_count':len(approved),'held_count':len(held),'approved':approved,'not_approved':held,'missing_blocks':[8],'policy':{'new_documents_do_not_add_weight':True,'new_cells_require_validation':True,'changed_values_invalidate_frozen_cell_digest':True,'new_metric_or_definition_requires_registry_version':True,'forecasts_separate':True,'no_automatic_chain_linking_or_interpolation':True,'confidence_not_a_societal_score':True,'publication_holds_fail_closed':True,'independent_uncertainty_bands_not_estimated':True},'verification':{'fresh_source_matches':sum(c['matches'] for c in checks),'income_check':income,'source_files':{f:hashlib.sha256((R/f).read_bytes()).hexdigest() for f in ['approval-source-12am.json','approval-source-12aq.json','main-metric-values.json','main-metric-income-inputs.json','main-metric-catalog.json']}},'limitations':['Existing source_verified/source_snapshot_checked labels retained, not independently upgraded for the other source families.','Fresh cell comparison checks numerical agreement, not all historical comparability or source sampling uncertainty.','The source catalog parent-series aliases for real income were resolved to actual keys explicitly; source records not changed.','No approved ESS or volunteer participation series yet; block 8 remains a quantitative gap.','Source numerical values remain unchanged; source validation/publication flags for freshly matched 12am/12aq history cells are upgraded by the guarded SQL import. Static frontend exports remain unchanged.']}
manifest['content_sha256']=hashlib.sha256(json.dumps(manifest,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
(O/'approved-main-metrics.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
lines=['# Hyväksytty päämittaristo, versio 1 — 26.10.2026','','Hyväksytty 18 mittaria kuvailevaan tarkasteluun: nimetyt sarjat, ryhmät, ajanjaksot ja lähteet. Hyväksyntä ei koske kokonaisindeksin painoja, normalisointia tai syyvaikutuksia. Havaintopisteet on jäädytetty koneelliseen rekisteriin; uusia vuosia ei hyväksytä automaattisesti.','','| Mittari | Lohko | Tallennetut hyväksytyt vuodet | Pisteitä | Tarkistuksen peruste |','|---|---:|---|---:|---|']
for a in approved:lines.append(f"| {a['title']} | {a['block']} | {a['coverage']['first']}–{a['coverage']['last']} | {len(a['cells'])} | {a['evidence_basis']} |")
lines+=['','Vuosiväli ei tarkoita aukotonta vuosittaista kattavuutta. Elinajanodotteen ennen vuotta 1971 julkaistut pisteet ovat monivuotisia jaksoja. Gini-sarjassa on vain kolme havaintoa; energiasarjassa neljä. Vaalisarjat piirretään vaalivuosiin. Käyrä ei ylitä määritelmäkatkoksia jatkuvana viivana.','','## Hyväksynnän tarkistukset','','- Miesten ja naisten elinajanodote sekä imeväiskuolleisuus haettiin 26.10.2026 uudelleen StatFinin 12am- ja 12aq-rajapinnoista. Kaikki 435 tietokantaan tallennettua arvoa täsmäsivät; hyväksyntään otetaan vain vuodet 1850–2025. Raakavastaukset ja SHA-256-tiivisteet säilytetään.','- Reaalisen käytettävissä olevan nettotulon 51 vuosiarvoa laskettiin uudelleen tallennetuista kansallisista lähdekopioista. Suurin ero oli 0 euroa/asukas. Lähdekopioita ei tällä laskentatarkistuksella koroteta uudelleen lähteestä varmennetuiksi.','- Muut hyväksynnät perustuvat olemassa olevaan source_verified/source_snapshot_checked-näyttöön sekä määritelmien, yksikön, ryhmän, aukkojen ja rajoitusten tarkistukseen. Kaikkia niiden lukuja ei haettu uudelleen alkuperäislähteestä.','','## Mittarikohtaiset rajat']
for a in approved:lines+=['',f"### {a['title']}", '',f"Sarja: `{a['series_key']}`. Ryhmä: `{a['group_key']}`. Yksikkö: {a['unit']}.", '',a['definition_and_limits'],'',f"[Lähde]({a['source_url']})"]
lines+=['','## Pois hyväksynnästä','','Luottamus eduskuntaan ja sosiaalinen luottamus jätettiin pois. Molemmissa ESS-sarjoissa on publication_hold ja painotettujen keskiarvojen toistamisvaatimus. reviewed-merkintä tai aiemman seulonnan B-luokka ei ohita tätä. Kansalaisyhteiskunnan lohkoon ei keksitä korvaavaa pistettä.','','## Koostaminen ja tietojen täydentyminen','','- Hyväksytyt mittarit eivät ole 18 toisistaan riippumatonta yhteiskuntavaikutusta. Miesten ja naisten elinajanodote kuuluu samaan riippuvuusklusteriin; samoin työllisyys/työttömyys ja julkisen talouden suhdeluvut.','- Kokonaisindeksin painot ja normalisointi ovat null; composite_approved=false. Erityisesti kokonaishedelmällisyydelle, energiankulutukselle, meno- tai velkasuhteelle ja vankiluvulle ei anneta automaattista hyvää/huonoa suuntaa.','- Uusi lähde täydentää samaa havaintopaikkaa. Sama ilmiö ei saa lisäpainoa lähteiden lukumäärästä.','- Riviarvon, ryhmän tai lähdeversion muutos käynnistää hyväksynnän tarkistuksen. Muutos säilyy versiona; vanhoja hyväksyttyjä soluja ei korvata hiljaisesti.','- Puuttuvat arvot ja havaintojen väliin jäävät vuodet eivät ole nollia. Vuosien 2026–2050 skenaariot hyväksytään myöhemmin erikseen.','','Koneellinen rekisteri: approved-main-metrics.json. Toistettava hyväksyntämoottori ja lähdepoiminnat: scripts/data/readiness/approve-main-metrics.py.']
(O/'paamittarit.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'approved':len(approved),'held':len(held),'approved_cells':sum(len(a['cells']) for a in approved),'digest':manifest['content_sha256']},indent=2))
