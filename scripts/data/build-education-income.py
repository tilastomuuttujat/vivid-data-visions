"""Keep medians, populations and wage universes separate; no causal allocation."""
import json,pathlib,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
def build(source,existing,education):
 income=[];wages=[];look={}
 for e in source['extracts']:
  for r in e['rows']:
   d=r['dimensions'];key=(e['name'],tuple(sorted(d.items())))
   if key in look:raise ValueError('Duplicate source cell')
   look[key]=r['value']
   if r['value'] is not None and r['value']<0:raise ValueError('Negative value needs explicit review')
   if e['name']=='income':income.append(dict(year=int(d['timeperiod_y']),age=d['ikaryhma_22_20191201'],sex=d['sukupuoli_9_20180101'],education=d['koulutusaste_21_20231110'],measure=d['contentscode'],value=r['value']))
   else:wages.append(dict(year=int(d['timeperiod_y']),age=d['ikaryhma_10_20180101'],sex=d['sukupuoli_9_20180101'],education=d['koulutusaste_17_20180101'],field=d['koulutusala_3_20180101'],measure=d['contentscode'],value=r['value']))
 verified=0
 for old in existing['observations']:
  if old['series_key'] not in ['vivid.groups.income.median','vivid.groups.income.population']:continue
  g=old['group_key'].split('=')[-1];measure='tjt-ekvikturaha_med' if old['series_key'].endswith('.median') else 'tjt-henkiloita'
  matches=[r for r in income if r['year']==old['year'] and r['education']==g and r['age']=='18-64' and r['sex']=='SSS' and r['measure']==measure]
  if len(matches)!=1 or matches[0]['value']!=old['value']:raise ValueError('Existing database source mismatch')
  verified+=1
 assert verified==150
 def val(g,year):
  return next(r['value'] for r in income if r['education']==g and r['year']==year and r['age']=='18-64' and r['sex']=='SSS' and r['measure']=='tjt-ekvikturaha_med')
 ratios=[dict(year=y,ratio=val('78',y)/val('9',y)) for y in range(2010,2025)]
 # Exact common education categories only; do not map 3 to 3_4 or 456 to 5_6.
 employment=[dict(r,education='78' if r['group_key'].endswith('=7_8') else '9') for r in education['employment_rates'] if r['group_key'] in ['FI|education=7_8','FI|education=9_X'] and 2010<=r['year']<=2024]
 return dict(version=1,retrieved_on=source['retrieved_on'],income=income,wages=wages,employment=employment,ratios=ratios,
  checks=dict(source_cells=len(look),suppressed_or_missing_cells=sum(v is None for v in look.values()),database_cells_independently_matched=verified,causal_decomposition=False),
  sources=[dict(name=e['name'],url=e['url'],request=e['request'],response_sha256=e['response_sha256'],response_updated=e['response_updated']) for e in source['extracts']],
  employment_source_sha256=hashlib.sha256(json.dumps(education,sort_keys=True,ensure_ascii=False).encode()).hexdigest(),
  existing_input_sha256=hashlib.sha256(json.dumps(existing,sort_keys=True,ensure_ascii=False).encode()).hexdigest(),
  source_sha256=hashlib.sha256(json.dumps(source,sort_keys=True,ensure_ascii=False).encode()).hexdigest(),
  notes=dict(real_income='14k5: eurot vuoden 2024 rahassa, henkilöiden ryhmittely oman koulutuksen mukaan; kotitalouden rahatulo kulutusyksikköä kohti on kaikille saman asuntokunnan jäsenille sama.',
  wages='15aw: kokoaikaiset palkansaajat, bruttokuukausiansiot 2024. Keskiarvo ja mediaani erillään; ryhmämediaaneja ei yhdistetä painotetuksi mediaaniksi.',
  classification='Työllisyysaineiston 3_4 ja 5_6 eivät vastaa tulotilaston 3 ja 456 ryhmiä. Rinnakkaiskäyrissä vain 78 ja 9; sama koulutusraja ei poista perusjoukkoeroa.',
  universes='Työllisyys: koko väestö 18–64; tulot: asuntoväestö 18–64, josta mm. asunnottomat ja laitoksissa asuvat puuttuvat; palkat: kokoaikaiset palkansaajat, ikärajauksen mukaan.',
  decomposition='Työllisyysosuutta ja tulo- tai palkkamediaania ei kerrota keskenään. Mediaanien erot eivät jaa muutosta veroihin, tulonsiirtoihin tai työaikaan.',
  time='Tulotaulukon valittu nykyinen sarja 2010–2024; ei koulutusryhmien yhtenäistä tulovertailua 1850–2009 eikä vuoden 2025 havaintoa. Palkat vain erillinen vuoden 2024 poikkileikkaus.',
  adjustment='Ikä-, sukupuoli- ja koulutusalakohtaiset poiminnat mahdollistavat rajatun kuvailevan vertailun. Ne eivät ole monimuuttujavakiointi tai tutkinnon kausaalivaikutus.',
  channels='Aineisto erottaa työllisten osuuden, henkilökohtaisen tulotason ja kokoaikaisten palkkatason käsitteet. Työajan, työttömyyden keston, valikoitumisen ja kotitalouden muiden tulojen osuuksia toimeentuloeroon ei pystytä erottamaan näistä mediaaneista. Tuotannontekijätulo sisältää myös omaisuustuloja eikä ole pelkkä palkka.'))
if __name__=='__main__':
 source=json.loads((ROOT/'src/data/research/education-income-source.json').read_text());existing=json.loads((ROOT/'src/data/research/education-income-existing.json').read_text());education=json.loads((ROOT/'src/data/research/education-assessment.json').read_text());out=build(source,existing,education)
 (ROOT/'src/data/research/education-income.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(out['checks']);print(out['ratios'][0],out['ratios'][-1])
