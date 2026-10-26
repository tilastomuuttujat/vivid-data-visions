import itertools,json,pathlib,urllib.request,hashlib
R=pathlib.Path(__file__).resolve().parent
from snapshot_inputs import ensure_snapshot_inputs
ensure_snapshot_inputs(R)
ind=json.loads((R/'indicators.json').read_text());vals=json.loads((R/'values.json').read_text());meta=json.loads((R/'statfin15ai-current-metadata.json').read_text())
series=[s for s in ind if (s.get('metadata') or {}).get('table')=='15ai' and not s['series_key'].endswith('.share4')]
index={v['code']:{t:k for k,t in zip(v['values'],v['valueTexts'])} for v in meta['variables']}
resolved=[];unresolved=[]
for s in series:
 m=s['metadata'];labels={'toimiala_79_20180101':m.get('industry'),'taloustoimi_1_20180101':m.get('transaction'),'contentscode':m.get('source_unit')}
 try:sel={dim:index[dim][t] for dim,t in labels.items()};resolved.append((s['series_key'],sel))
 except KeyError:unresolved.append({'series_key':s['series_key'],'labels':labels})
query={'query':[],'response':{'format':'json-stat2'}}
for v in meta['variables']:
 code=v['code'];selected=v['values'] if code=='timeperiod_y' else sorted({d[code] for k,d in resolved})
 query['query'].append({'code':code,'selection':{'filter':'item','values':selected}})
u='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ntp/15ai.px';req=urllib.request.Request(u,data=json.dumps(query).encode(),headers={'Content-Type':'application/json'})
raw=urllib.request.urlopen(req,timeout=40).read();(R/'statfin15ai-response.json').write_bytes(raw);(R/'statfin15ai-request.json').write_text(json.dumps(query,indent=2)+'\n');d=json.loads(raw)
def cells(d):
 cats=[]
 for dim in d['id']:
  index=d['dimension'][dim]['category']['index'];cats.append([k for k,v in sorted(index.items(),key=lambda x:x[1])])
 for i,c in enumerate(itertools.product(*cats)):
  val=d['value'].get(str(i)) if isinstance(d['value'],dict) else d['value'][i];yield dict(zip(d['id'],c)),val
lookup={tuple(c[k] for k in d['id']):v for c,v in cells(d)};results=[]
for key,sel in resolved:
 rows=[v for v in vals if v['series_key']==key];changes=[];matched=0
 for v in rows:
  c={**sel,'timeperiod_y':str(v['year'])};new=lookup.get(tuple(c[k] for k in d['id']));old=float(v['value']) if v['value'] is not None else None
  if new is not None and old is not None and abs(float(new)-old)<=1e-7*max(1,abs(old)):matched+=1
  elif new is None and old is None:matched+=1
  else:changes.append({'year':v['year'],'old':old,'new':new})
 results.append({'family':'indicator','series_key':key,'source':'15ai','checked_cells':len(rows),'matched':matched,'changes':changes,'request_file':'statfin15ai-request.json','response_sha256':hashlib.sha256(raw).hexdigest()})
# All three sexes and both mortality measures, using the already fetched exact source responses.
for table in ['12am','12aq']:
 p=R.parent/'readiness'/('approval-source-'+table+'.json');raw2=p.read_bytes();data=json.loads(raw2);lookup2={(int(c['timeperiod_y']),c['sukupuoli_9_20180101'],c['contentscode']):v for c,v in cells(data)}
 for s in ind:
  key=s['series_key']
  if not key.startswith('statfin.'+table+'.'):continue
  sex=key.split('.sex')[-1];content=key.split('.')[-2];rr=[v for v in vals if v['series_key']==key];changes=[];matched=0
  for v in rr:
   new=lookup2.get((v['year'],sex,content));old=float(v['value']) if v['value'] is not None else None
   if (new is None and old is None) or (new is not None and old is not None and abs(float(new)-old)<1e-8):matched+=1
   else:changes.append({'year':v['year'],'old':old,'new':new})
  results.append({'family':'indicator','series_key':key,'source':table,'checked_cells':len(rr),'matched':matched,'changes':changes,'response_sha256':hashlib.sha256(raw2).hexdigest(),'response_file':str(p.relative_to(R.parents[2]))})
report={'checked_on':'2026-10-26','results':results,'unresolved_15ai':unresolved,'comparison_scope':'All stored years for the selected series, not only 1800s. No silent value replacement.'}
(R/'live-comparison.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'series':len(results),'cells':sum(x['checked_cells'] for x in results),'changes':sum(len(x['changes']) for x in results),'unresolved':unresolved},ensure_ascii=False))
