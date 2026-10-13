"""Fetch regional snapshots with original responses and API queries for reproducibility."""
import json, urllib.request, pathlib, datetime
root=pathlib.Path(__file__).resolve().parents[2]
regions=json.loads((root/'src/data/maakunnat.json').read_text())['regions']
ids=[r['id'] for r in regions]+['SSS']
raw={}
def fetch(ds,table,selections):
    url=f'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/{ds}/{table}.px'
    query=[{'code':k,'selection':{'filter':'item','values':v}} for k,v in selections.items()]
    req=urllib.request.Request(url,data=json.dumps({'query':query,'response':{'format':'json'}}).encode(),headers={'Content-Type':'application/json'})
    response=json.loads(urllib.request.urlopen(req,timeout=50).read())
    raw[table]={'url':url,'query':query,'response':response};print(table,len(response['data']),flush=True)
    return response
pop=fetch('vaerak','11ra',{'alue_23_20260101':ids,'timeperiod_y':[str(y) for y in range(1990,2025)],'contentscode':['vaerak-vaesto','vaesto_yli64_p']})
income=fetch('tjt','14ww',{'alue_23_20250101':ids,'timeperiod_y':[str(y) for y in range(1995,2025)],'contentscode':['tjt-ekvikturaha_med','rpt_aste']})
industry=['C10TC12','C13TC15','C16TC18','C19TC22','C23','C24TC30','C31TC33']
jobs=fetch('altp','12bg',{'alue_23_20250101':ids,'taloustoimi_1_20180101':['E1'],'toimiala_79_20180101':['SSS','J']+industry,'sektoriluokitus_7_20230101':['S1'],'timeperiod_y':[str(y) for y in range(2000,2025)],'contentscode':['altp-cp_alkup']})
points={}
def entries(response):
    keys=[c['code'] for c in response['columns'] if c['type']!='c'];measures=[c['code'] for c in response['columns'] if c['type']=='c']
    for r in response['data']:
        key=dict(zip(keys,r['key'])); vals={k:float(v) if v not in ['.','..','...',''] else None for k,v in zip(measures,r['values'])}
        yield key,vals
for key,v in entries(pop):
    rid=key['alue_23_20260101'];yr=int(key['timeperiod_y']);points[rid,yr]={'year':yr,'population':v['vaerak-vaesto'],'olderShare':v['vaesto_yli64_p'],'income':None,'poverty':None,'jobs':None,'industry':None,'information':None}
for key,v in entries(income):
    p=points[key['alue_23_20250101'],int(key['timeperiod_y'])];p.update(income=v['tjt-ekvikturaha_med'],poverty=v['rpt_aste'])
groups={}
for key,v in entries(jobs):
    k=key['alue_23_20250101'],int(key['timeperiod_y']);groups.setdefault(k,{})[key['toimiala_79_20180101']]=v['altp-cp_alkup']
for k,v in groups.items():
    p=points[k];p['jobs']=v['SSS']*1000 if v['SSS'] is not None else None;p['information']=v['J']*1000 if v['J'] is not None else None
    p['industry']=sum(v[i] for i in industry)*1000 if all(v.get(i) is not None for i in industry) else None
out={'retrieved':datetime.date.today().isoformat(),'regions':[{'id':r['id'],'name':r['name'],'points':[points[r['id'],y] for y in range(1990,2025)]} for r in regions+[{'id':'SSS','name':'Koko maa'}]]}
(root/'src/components/planeetta/regional-path-data.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
(root/'scripts/data/regional-path-sources.json').write_text(json.dumps({k:{'url':v['url'],'query':v['query'],'columns':v['response']['columns'],'rowCount':len(v['response']['data'])} for k,v in raw.items()},ensure_ascii=False,indent=2)+'\n')
