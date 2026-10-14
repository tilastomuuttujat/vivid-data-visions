"""Bundle comparable regional work series through 2024; standard library only."""
import concurrent.futures, datetime, hashlib, json, pathlib, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
CACHE=pathlib.Path('/tmp/work-opportunity-cache');CACHE.mkdir(exist_ok=True)
regions=json.loads((ROOT/'src/data/maakunnat.json').read_text())['regions']+[{'id':'SSS','name':'Koko maa'}]
ids=[r['id'] for r in regions]
years=lambda start:[str(y) for y in range(start,2025)]
months=[f'{y}M{m:02}' for y in range(2009,2025) for m in range(1,13)]
specs=[('tyokay','115b',{'paaasial_toimin_3_20180101':['SSS','11','12','21-99'],'sukupuoli_9_20180101':['SSS'],'ikaryhma_10_20180101':['18-64'],'timeperiod_y':years(1987),'contentscode':['tyokay-vaesto']},'2025'),
 ('tyokay','115h',{'toimiala_108_20230101':['SSS','A','C','F','J','M','Q'],'sukupuoli_9_20180101':['SSS'],'timeperiod_y':years(2007),'contentscode':['tyolliset3']},'2026'),
 ('tyonv','12r5',{'timeperiod_m':months,'contentscode':['TYOTTOMATLOPUSSA','PITKAAIKAISTYOTTOMAT','AVPAIKATLOPUSSA']},None),
 ('muutl','11ae',{'timeperiod_y':years(1990),'contentscode':['muutl-vm43_netto','muutl-vm4142','muutl-luonvalisays']},'2026')]
def fetch(spec):
 ds,table,selections,agg=spec;url=f'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/{ds}/{table}.px'
 meta=json.load(urllib.request.urlopen(url,timeout=60))
 area=next(v['code'] for v in meta['variables'] if v['text'] in ['Alue','Työpaikan alue'])
 query=[]
 for v in meta['variables']:
  code=v['code'];values=ids if code==area else selections[code]
  query.append({'code':code,'selection':{'filter':f'agg:_Maakunnat {agg}.agg' if code==area and agg else 'item','values':values}})
 payload={'query':query,'response':{'format':'json'}}
 request=urllib.request.Request(url,data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(request,timeout=90) as response:raw=response.read()
 a=json.loads(raw);(CACHE/f'{table}.json').write_bytes(raw)
 print(table,len(a['data']),flush=True)
 return table,dict(url=url,query=query,sha256=hashlib.sha256(raw).hexdigest(),metadata=a.get('metadata',[]),columns=a['columns'],response=a)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:raw=dict(pool.map(fetch,specs))
points={(r['id'],y):{'year':y,'workingAge':None,'employed':None,'unemployed':None,'outside':None,'jobs':{},'jobseekers':None,'longTerm':None,'vacancies':None,'domesticNet':None,'internationalNet':None,'naturalChange':None} for r in regions for y in range(1987,2025)}
def entries(table):
 response=raw[table]['response'];keys=[c['code'] for c in response['columns'] if c['type']!='c'];measures=[c['code'] for c in response['columns'] if c['type']=='c']
 for row in response['data']:
  k=dict(zip(keys,row['key']));values={c:None if v in ['.','..','...',''] else float(v) for c,v in zip(measures,row['values'])}
  yield k,values
for k,v in entries('115b'):
 p=points[k['alue_23_20250101'],int(k['timeperiod_y'])];p[{'SSS':'workingAge','11':'employed','12':'unemployed','21-99':'outside'}[k['paaasial_toimin_3_20180101']]]=v['tyokay-vaesto']
for k,v in entries('115h'):points[k['alue_23_20260101'],int(k['timeperiod_y'])]['jobs'][k['toimiala_108_20230101']]=v['tyolliset3']
monthly={}
for k,v in entries('12r5'):
 rid=k['Alue'];year=int(k['timeperiod_m'][:4]);monthly.setdefault((rid,year),[]).append(v)
for key,rows in monthly.items():
 assert len(rows)==12, (key,len(rows))
 for measure,field in [('TYOTTOMATLOPUSSA','jobseekers'),('PITKAAIKAISTYOTTOMAT','longTerm'),('AVPAIKATLOPUSSA','vacancies')]:
  vals=[r[measure] for r in rows];points[key][field]=sum(vals)/12 if all(v is not None for v in vals) else None
for k,v in entries('11ae'):
 p=points[k['alue_23_20260101'],int(k['timeperiod_y'])]
 for measure,field in [('muutl-vm43_netto','domesticNet'),('muutl-vm4142','internationalNet'),('muutl-luonvalisays','naturalChange')]:p[field]=v[measure]
for p in points.values():
 if all(p[k] is not None for k in ['workingAge','employed','unemployed','outside']):assert p['workingAge']==p['employed']+p['unemployed']+p['outside']
 if p['longTerm'] is not None:assert p['longTerm']<=p['jobseekers']
output={'retrieved':datetime.date.today().isoformat(),'through':2024,'sources':{t:{k:v for k,v in s.items() if k!='response'} for t,s in raw.items()},'regions':[{'id':r['id'],'name':r['name'],'points':[points[r['id'],y] for y in range(1987,2025)]} for r in regions]}
(ROOT/'src/components/planeetta/work-opportunity-data.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
print('Saved',len(regions),'regions',flush=True)
