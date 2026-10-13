"""Refresh StatFin 14ww redistribution series, preserving source response and query."""
import json, urllib.request, pathlib, datetime
root=pathlib.Path(__file__).resolve().parents[2]
regions=json.loads((root/'src/data/maakunnat.json').read_text())['regions']+[{'id':'SSS','name':'Koko maa'}]
url='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/tjt/14ww.px'
measures=['gini_tuotektu','gini_bruttotu','gini_kturaha','yht_vai','sts_vai','mts_vai']
query=[{'code':'alue_23_20250101','selection':{'filter':'item','values':[r['id'] for r in regions]}},{'code':'timeperiod_y','selection':{'filter':'item','values':[str(y) for y in range(1995,2025)]}},{'code':'contentscode','selection':{'filter':'item','values':measures}}]
req=urllib.request.Request(url,data=json.dumps({'query':query,'response':{'format':'json'}}).encode(),headers={'Content-Type':'application/json'})
d=json.loads(urllib.request.urlopen(req,timeout=45).read())
keys=[c['code'] for c in d['columns'] if c['type']!='c'];cols=[c['code'] for c in d['columns'] if c['type']=='c']
rows={}
for entry in d['data']:
    k=dict(zip(keys,entry['key']));v={c:float(a) if a not in ['.','..','...',''] else None for c,a in zip(cols,entry['values'])}
    rows[k['alue_23_20250101'],int(k['timeperiod_y'])]={'year':int(k['timeperiod_y']),**v}
out={'retrieved':datetime.date.today().isoformat(),'regions':[{'id':r['id'],'name':r['name'],'points':[rows[r['id'],y] for y in range(1995,2025)]} for r in regions],'source':{'url':url,'query':query,'response':d}}
(root/'src/components/planeetta/redistribution-data.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
print(out['regions'][-1]['points'][0]);print(out['regions'][-1]['points'][-1])
