"""Aggregate official municipal flows with the official 2026 region key."""
import json,urllib.request,hashlib
from pathlib import Path
from datetime import datetime,timezone
URL='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/synt/12dy.px'
MAP='https://api.stat.fi/classificationservice/open/api/classifications/v2/correspondenceTables/kunta_1_20260101%23maakunta_1_20260101/maps?content=data&format=json&lang=fi&meta=min'
OUT=Path(__file__).with_name('sources')/'population-regions.json'
METRICS=['synt-vm01','synt-vm11','synt-luonvalisays','synt-vm43_netto','synt-vm41','synt-vm42','synt-vm4142','synt-koknetmuutto','synt-valisays','synt-vakorjaus','synt-kokmuutos','synt-vaesto']
def fetch(u,q=None):return urllib.request.urlopen(urllib.request.Request(u,data=json.dumps(q).encode() if q else None,headers={'Content-Type':'application/json'}),timeout=90).read()
def aggregate(j,mapping):
 dims=[c['code'] for c in j['columns'] if c['type']!='c'];metrics=[c['code'] for c in j['columns'] if c['type']=='c'];rows={};country={};seen=set()
 if set(metrics)!=set(METRICS):raise ValueError('Regional metrics changed')
 for r in j['data']:
  d=dict(zip(dims,r['key']));y=int(d['timeperiod_y']);area=next(d[k] for k in d if k.startswith('alue_'))
  if (area,y) in seen or len(r['values'])!=len(metrics):raise ValueError('Duplicate regional input')
  seen.add((area,y));values={k:int(v) for k,v in zip(metrics,r['values'])}
  if area=='SSS':country[y]=values;continue
  code=area.removeprefix('KU')
  if code not in mapping:raise ValueError('Municipality missing from official key')
  target=mapping[code]['region'];row=rows.setdefault((target,y),dict.fromkeys(METRICS,0))
  for k,v in values.items():row[k]+=v
 if seen!={(a,y) for a in ['SSS']+['KU'+k for k in mapping] for y in range(1990,2026)}:raise ValueError('Incomplete municipality/year grid')
 return [dict(region=k,year=y,**v) for (k,y),v in sorted(rows.items())],[dict(year=y,**v) for y,v in sorted(country.items())]
def main():
 rawmap=fetch(MAP);m=json.loads(rawmap);mapping={x['sourceItem']['code']:{'region':'MK'+x['targetItem']['code'],'name':x['targetItem']['classificationItemNames'][0]['name']} for x in m}
 if len(mapping)!=308 or len({v['region'] for v in mapping.values()})!=19 or len(mapping)!=len(m):raise ValueError('Official 2026 map differs')
 rawmeta=fetch(URL);meta=json.loads(rawmeta);q={'query':[],'response':{'format':'json'}}
 for v in meta['variables']:
  values=METRICS if v['code']=='contentscode' else v['values'];q['query'].append({'code':v['code'],'selection':{'filter':'item','values':values}})
 responses=[];j=None;queries=[]
 for start in [1990,1999,2008,2017]:
  part=json.loads(json.dumps(q));next(x for x in part['query'] if x['code']=='timeperiod_y')['selection']['values']=[str(y) for y in range(start,start+9)]
  rawpart=fetch(URL,part);data=json.loads(rawpart);responses.append(hashlib.sha256(rawpart).hexdigest());queries.append(part)
  if j is None:j=data
  else:
   if j['columns']!=data['columns']:raise ValueError('Chunk schema differs')
   j['data'].extend(data['data'])
  print('Fetched',start,start+8,flush=True)
 raw=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode();rows,country=aggregate(j,mapping)
 p=dict(url=URL,queries=queries,response_chunk_sha256=responses,retrieved_at=datetime.now(timezone.utc).isoformat(),combined_response_sha256=hashlib.sha256(raw).hexdigest(),metadata_sha256=hashlib.sha256(rawmeta).hexdigest(),mapping_url=MAP,mapping_response_sha256=hashlib.sha256(rawmap).hexdigest(),mapping=mapping,metrics=METRICS,rows=rows,country=country,source_metadata=json.loads(raw).get('metadata'),source_columns=json.loads(raw)['columns'],aggregation='Sum all municipalities within their official 2026 region; no inferred or historical membership; net domestic flows cancel within each region.')
 OUT.write_text(json.dumps(p,ensure_ascii=False,separators=(',',':'))+'\n');print('Collected',len(rows),'region-year rows; 308 municipalities; official mapping',flush=True)
if __name__=='__main__':main()
