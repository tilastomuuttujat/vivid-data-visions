import itertools,json,pathlib
R=pathlib.Path(__file__).resolve().parent
from snapshot_inputs import ensure_snapshot_inputs
ensure_snapshot_inputs(R)
s=json.loads((R/'finance.json').read_text());vals=json.loads((R/'finance_values.json').read_text());d=json.loads((R/'statfin15ai-response.json').read_text());meta=json.loads((R/'statfin15ai-current-metadata.json').read_text())
index={v['code']:{t:k for k,t in zip(v['values'],v['valueTexts'])} for v in meta['variables']};cats=[]
for dim in d['id']:cats.append([k for k,v in sorted(d['dimension'][dim]['category']['index'].items(),key=lambda x:x[1])])
lookup={}
for i,c in enumerate(itertools.product(*cats)):
 v=d['value'].get(str(i)) if isinstance(d['value'],dict) else d['value'][i];lookup[tuple(c)]=v
results=[];unresolved=[]
for x in s:
 if x['source_key']!='statfin15ai_attachment_20261018':continue
 parts=x['title'].split(' — ')
 try:
  sel={'toimiala_79_20180101':index['toimiala_79_20180101'][parts[0]],'taloustoimi_1_20180101':index['taloustoimi_1_20180101'][parts[1]],'contentscode':index['contentscode'][parts[-1]]}
 except KeyError:unresolved.append(x['series_key']);continue
 rows=[v for v in vals if v['series_key']==x['series_key']];matched=0;changes=[]
 for v in rows:
  c={**sel,'timeperiod_y':str(v['year'])};new=lookup.get(tuple(c[k] for k in d['id']));old=float(v['value']) if v['value'] is not None else None
  if (new is None and old is None) or (new is not None and old is not None and abs(float(new)-old)<=1e-7*max(1,abs(old))):matched+=1
  else:changes.append({'year':v['year'],'old':old,'new':new})
 results.append({'family':'finance','series_key':x['series_key'],'source':'15ai','checked_cells':len(rows),'matched':matched,'changes':changes,'selection':sel})
report={'results':results,'unresolved':unresolved,'checked_on':'2026-10-26'};(R/'finance-copy-comparison.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'series':len(results),'cells':sum(x['checked_cells'] for x in results),'changes':sum(len(x['changes']) for x in results),'unresolved':unresolved}))
