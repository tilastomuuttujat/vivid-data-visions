"""Refresh municipal comparisons on fixed boundary classifications (standard library)."""
import concurrent.futures,datetime,hashlib,json,pathlib,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
CACHE=pathlib.Path('/tmp/local-adaptation-cache');CACHE.mkdir(exist_ok=True)
places=[('KU075','Hamina'),('KU205','Kajaani'),('KU734','Salo'),('SSS','Koko maa')]
ids=[r[0] for r in places]
years=lambda start:[str(y) for y in range(start,2025)]
ages=[f'{y}-{y+4}' for y in range(20,65,5)]
specs=[('tyokay','115b',{'paaasial_toimin_3_20180101':['SSS','11','12','21-99'],'sukupuoli_9_20180101':['SSS'],'ikaryhma_10_20180101':['18-64'],'timeperiod_y':years(1987),'contentscode':['tyokay-vaesto']}),
 ('tyokay','115h',{'toimiala_108_20230101':['SSS','A','C','F','J','M','Q'],'sukupuoli_9_20180101':['SSS'],'timeperiod_y':years(2007),'contentscode':['tyolliset3']}),
 ('muutl','11ae',{'timeperiod_y':years(1990),'contentscode':['muutl-vaesto','muutl-vm43_netto','muutl-vm4142','muutl-luonvalisays']}),
 ('vkour','12bs',{'ikaryhma_10_20180101':ages,'sukupuoli_9_20180101':['SSS'],'timeperiod_y':years(2007),'contentscode':['vaesto_15_','kaste5T8','kaste3T8']}),
 ('tjt','14ww',{'timeperiod_y':years(2010),'contentscode':['tjt-ekvikturaha_med','rpt_aste']}),
 ('tyonv','12r5',{'timeperiod_m':[f'{y}M{m:02}' for y in range(2009,2025) for m in range(1,13)],'contentscode':['TYOTTOMATLOPUSSA','PITKAAIKAISTYOTTOMAT']})]
def fetch(spec):
 ds,t,selections=spec;url=f'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/{ds}/{t}.px'
 meta=json.load(urllib.request.urlopen(url,timeout=60));area=next(v['code'] for v in meta['variables'] if v['text'] in ['Alue','Työpaikan alue','Alue 2026'])
 query=[{'code':v['code'],'selection':{'filter':'item','values':ids if v['code']==area else selections[v['code']]}} for v in meta['variables']]
 request=urllib.request.Request(url,data=json.dumps({'query':query,'response':{'format':'json'}}).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(request,timeout=90) as response:raw=response.read()
 a=json.loads(raw);(CACHE/f'{t}.json').write_bytes(raw);print(t,len(a['data']),flush=True)
 return t,dict(url=url,query=query,sha256=hashlib.sha256(raw).hexdigest(),metadata=a.get('metadata',[]),columns=a['columns'],response=a)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:raw=dict(pool.map(fetch,specs))
points={(rid,y):dict(year=y,population=None,workingAge=None,employed=None,unemployed=None,outside=None,jobs={},domesticNet=None,internationalNet=None,naturalChange=None,educationPopulation=None,higherEducation=None,qualification=None,income=None,poverty=None,jobseekers=None,longTerm=None) for rid,_ in places for y in range(1987,2025)}
def entries(table):
 r=raw[table]['response'];keys=[c['code'] for c in r['columns'] if c['type']!='c'];measures=[c['code'] for c in r['columns'] if c['type']=='c']
 for row in r['data']:yield dict(zip(keys,row['key'])),{c:None if v in ['.','..','...',''] else float(v) for c,v in zip(measures,row['values'])}
for k,v in entries('115b'):points[k['alue_23_20250101'],int(k['timeperiod_y'])][{'SSS':'workingAge','11':'employed','12':'unemployed','21-99':'outside'}[k['paaasial_toimin_3_20180101']]]=v['tyokay-vaesto']
for k,v in entries('115h'):points[k['alue_23_20260101'],int(k['timeperiod_y'])]['jobs'][k['toimiala_108_20230101']]=v['tyolliset3']
for k,v in entries('11ae'):
 p=points[k['alue_23_20260101'],int(k['timeperiod_y'])]
 for measure,field in [('muutl-vaesto','population'),('muutl-vm43_netto','domesticNet'),('muutl-vm4142','internationalNet'),('muutl-luonvalisays','naturalChange')]:p[field]=v[measure]
education={}
for k,v in entries('12bs'):education.setdefault((k['alue_23_20260101'],int(k['timeperiod_y'])),[]).append(v)
for key,rows in education.items():
 assert len(rows)==9,(key,len(rows))
 for measure,field in [('vaesto_15_','educationPopulation'),('kaste5T8','higherEducation'),('kaste3T8','qualification')]:
  vals=[r[measure] for r in rows];points[key][field]=sum(vals) if all(v is not None for v in vals) else None
for k,v in entries('14ww'):points[k['alue_23_20250101'],int(k['timeperiod_y'])].update(income=v['tjt-ekvikturaha_med'],poverty=v['rpt_aste'])
monthly={}
for k,v in entries('12r5'):monthly.setdefault((k['Alue'],int(k['timeperiod_m'][:4])),[]).append(v)
for key,rows in monthly.items():
 assert len(rows)==12,(key,len(rows))
 for measure,field in [('TYOTTOMATLOPUSSA','jobseekers'),('PITKAAIKAISTYOTTOMAT','longTerm')]:
  vals=[r[measure] for r in rows];points[key][field]=sum(vals)/12 if all(v is not None for v in vals) else None
for p in points.values():
 if all(p[k] is not None for k in ['workingAge','employed','unemployed','outside']):assert p['workingAge']==p['employed']+p['unemployed']+p['outside']
 if p['higherEducation'] is not None:assert p['higherEducation']<=p['qualification']<=p['educationPopulation']
 if p['longTerm'] is not None:assert p['longTerm']<=p['jobseekers']
output={'retrieved':datetime.date.today().isoformat(),'through':2024,'sources':{t:{k:v for k,v in s.items() if k!='response'} for t,s in raw.items()},'places':[{'id':rid,'name':name,'points':[points[rid,y] for y in range(1987,2025)]} for rid,name in places]}
(ROOT/'src/components/planeetta/local-adaptation-data.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
print('Saved four areas, six sources',flush=True)
