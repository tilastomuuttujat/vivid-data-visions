"""Rebuild fiscal accounting model from pinned database export; no causal attribution."""
import json, hashlib, pathlib, argparse
from decimal import Decimal as D
ROOT=pathlib.Path(__file__).resolve().parents[2]
VERSION='fiscal_balance_v1'
FORMULA='balance=OTRS-OTES; parts=[D2R,D5R,D61R,other_revenue,-D62K,-D1K,-P2K-D632K,-D411K+D411KS13,-other_expenditure]; numerator_i=100*(ci_t-ci_b)*(1/Gt+1/Gb)/2; denominator=50*(Bt+Bb)*(1/Gt-1/Gb); baseline=1990'
LABELS={'production_taxes':'Tuotannon ja tuonnin verot','income_taxes':'Tulo- ja varallisuusverot pl. pääomaverot','contributions':'Sosiaaliturvamaksut','other_revenue':'Muut tulot','benefits':'Rahamääräiset sosiaalietuudet','staff':'Palkansaajakorvaukset','purchases':'Välituotekäyttö ja ostetut luontoisetuudet','interest':'Todelliset korkomenot, julkisyhteisöjen väliset korot vähennetty','other_expenditure':'Muut menot'}
def canonical(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def build(payload):
 obs={}; meta={s['series_key']:s for s in payload['series']}
 for o in payload['observations']:
  k=(o['series_key'],o['year'])
  if k in obs:raise ValueError('Duplicate observation')
  if o['validation_status']=='needs_review':raise ValueError('Input needs review')
  obs[k]=D(str(o['value']))
 def value(code,y):return obs[('statfin15ah.v20260918.s13.'+code+'.eur_m',y)]
 rows={}
 for y in range(1975,2026):
  G=obs[('statfin15ai.v20260918.total.b1gmh.u5',y)]
  R,E=value('otrs',y),value('otes',y);B=value('b9',y)
  if abs(R-E-B)>D('2'):raise ValueError('Revenue-expenditure identity failed')
  c={'production_taxes':value('d2r',y),'income_taxes':value('d5r',y),'contributions':value('d61r',y),'benefits':-value('d62k',y),'staff':-value('d1k',y),'purchases':-value('p2k',y)-value('d632k',y),'interest':-value('d411k',y)+value('d411ks13',y)}
  c['other_revenue']=R-c['production_taxes']-c['income_taxes']-c['contributions']
  c['other_expenditure']=-E-c['benefits']-c['staff']-c['purchases']-c['interest']
  if abs(sum(c.values())-(R-E))>D('.00001'):raise ValueError('Components fail reconciliation')
  source_pct=obs[('statfin15ah.v20260918.s13.b9.gdp_pct',y)]
  if abs(100*B/G-source_pct)>D('.11'):raise ValueError('GDP ratio mismatch')
  rows[y]=dict(gdp=G,revenue=R,expenditure=E,balance=R-E,reported_balance=B,components=c)
 base=rows[1990];points=[]
 for y in range(1850,2051):
  if y not in rows:
   points.append(dict(year=y,status='not_computable',reason='no_source' if y<=2025 else 'no_scenario',balance_pct=None,revenue_pct=None,expenditure_pct=None,change_pp=None,parts=[]));continue
  a=rows[y];factor=50*(1/a['gdp']+1/base['gdp']);parts=[dict(key=k,label=LABELS[k],value_pp=float((a['components'][k]-base['components'][k])*factor)) for k in LABELS]
  denominator=50*(a['balance']+base['balance'])*(1/a['gdp']-1/base['gdp']);parts.append(dict(key='gdp_denominator',label='BKT:n nimittäjävaikutus',value_pp=float(denominator)))
  delta=100*a['balance']/a['gdp']-100*base['balance']/base['gdp']
  if abs(sum(D(str(p['value_pp'])) for p in parts)-delta)>D('.0000001'):raise ValueError('Ratio decomposition failed')
  points.append(dict(year=y,status='computed',preliminary=y>=2024,balance_pct=float(100*a['balance']/a['gdp']),revenue_pct=float(100*a['revenue']/a['gdp']),expenditure_pct=float(100*a['expenditure']/a['gdp']),change_pp=float(delta),balance_million_euros=float(a['balance']),source_identity_residual_million=float(a['balance']-a['reported_balance']),parts=parts))
 h=hashlib.sha256(canonical(payload).encode()).hexdigest();engine=hashlib.sha256(FORMULA.encode()).hexdigest(); codehash=hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest()
 return dict(model=VERSION,release_id=hashlib.sha256((h+engine+codehash).encode()).hexdigest(),input_sha256=h,formula_sha256=engine,engine_sha256=codehash,formula=FORMULA,baseline=1990,sector='S13 Julkisyhteisöt, sulautettu',unit='prosenttia BKT:sta; muutos prosenttiyksikköinä',source_vintage=payload['vintage'],sources=[dict(title='Tilastokeskus 15ah, julkisyhteisöjen tulot ja menot',url='https://pxdata.stat.fi/PxWeb/fi/StatFin/StatFin__ntp/15ah.px/'),dict(title='Tilastokeskus 15ai, BKT käyvin hinnoin',url='https://pxdata.stat.fi/PxWeb/fi/StatFin/StatFin__ntp/15ai.px/')],points=points,checks=dict(accounting_identity=True,component_reconciliation=True,ratio_reconciliation=True,source_gdp_ratio=True),limitations=['Kirjanpidollinen osittelu, ei suhdanteen ja päätösten syyvaikutusten erottelu.','Verokertymä ei erottele veropohjaa, verokantoja eikä maksujen ajoitusta.','Rahamääräiset sosiaalietuudet sisältävät myös eläkkeitä; eivät yksin työttömyysmenoja.','Palkansaajakorvaukset ja ostot eivät mittaa palvelutarvetta tai laatua.','Muut menot sisältävät esimerkiksi investointeja ja pääomansiirtoja; eivät selittämätön kausaalinen vaikutus.','S13 sisältää valtion, paikallishallinnon ja sosiaaliturvarahastot; ei valtion budjettivaje eikä velan muutos.','Käypähintaisten erien muutoksissa näkyy myös hintojen muutos. Ei inflaatiosta puhdistettua menotarpeen arviota.','Lähteen euromäärät pyöristetty; tulot miinus menot täsmäytetään B9-sarjaan enintään2milj.euron toleranssilla.','Puuttuvia vuosia ei interpoloida eikä tulevaisuutta ekstrapoloida.'])
def main():
 p=argparse.ArgumentParser();p.add_argument('--input',type=pathlib.Path,default=ROOT/'src/data/research/fiscal-inputs.json');p.add_argument('--output',type=pathlib.Path,default=ROOT/'src/data/research/fiscal-model.json');a=p.parse_args();out=build(json.loads(a.input.read_text()));a.output.parent.mkdir(parents=True,exist_ok=True);tmp=a.output.with_suffix('.tmp');tmp.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');tmp.replace(a.output);print(out['release_id'],len([x for x in out['points'] if x['status']=='computed']))
if __name__=='__main__':main()
