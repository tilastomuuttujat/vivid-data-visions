"""Verify the selected pinned fiscal database observations against official PxWeb cells."""
import json,urllib.request,pathlib,hashlib,datetime
ROOT=pathlib.Path(__file__).resolve().parents[2]
p=json.loads((ROOT/'src/data/research/fiscal-inputs.json').read_text());db={(o['series_key'],o['year']):o['value'] for o in p['observations']};reports=[]
for table in ['15ah','15ai']:
 u=f'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ntp/{table}.px';m=json.load(urllib.request.urlopen(u,timeout=30));q=[]
 for v in m['variables']:
  c=v['code']
  if c=='timeperiod_y':vals=[str(y) for y in range(1975,2026)]
  elif c=='contentscode':
   vals=['ntp-cp','ntp-bkt_suhde'] if table=='15ah' else [code for code,text in zip(v['values'],v['valueTexts']) if text.startswith('Käyvin hinnoin, 1975-')]
   if not vals:raise ValueError('Nominal GDP content code missing')
  elif c.startswith('sektori'):vals=['S13']
  elif c.startswith('toimiala'):vals=['SSS']
  elif c.startswith('talous'):vals=['OTRS','OTES','B9','D2R','D5R','D61R','D62K','D1K','P2K','D632K','D411K','D411KS13'] if table=='15ah' else ['B1GMH']
  else:raise ValueError('Unexpected dimension')
  q.append(dict(code=c,selection=dict(filter='item',values=vals)))
 request={'query':q,'response':{'format':'json'}};raw=urllib.request.urlopen(urllib.request.Request(u,data=json.dumps(request).encode(),headers={'Content-Type':'application/json'}),timeout=30).read();d=json.loads(raw);keys=[c['code'] for c in d['columns'] if c['type']!='c'];cols=[c['code'] for c in d['columns'] if c['type']=='c'];n=0
 for row in d['data']:
  dim=dict(zip(keys,row['key']));year=int(dim['timeperiod_y'])
  for c,value in zip(cols,row['values']):
   if table=='15ai':key='statfin15ai.v20260918.total.b1gmh.u5'
   elif c=='ntp-cp':key='statfin15ah.v20260918.s13.'+dim['taloustoimi_1_20180101'].lower()+'.eur_m'
   elif dim['taloustoimi_1_20180101']=='B9':key='statfin15ah.v20260918.s13.b9.gdp_pct'
   else:continue
   if value in ['.','..','...','']:raise ValueError('Missing official cell')
   if float(value)!=db[key,year]:raise ValueError(f'Source revision or import mismatch: {key}, {year}')
   n+=1
 reports.append(dict(table=table,url=u,request=request,response_sha256=hashlib.sha256(raw).hexdigest(),matched_cells=n))
out=dict(input_sha256=hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),checked_on=datetime.date.today().isoformat(),all_selected_cells_match=True,reports=reports,note='Independent source-cell comparison; this does not validate causal interpretations. Fails closed when the official source changes.')
(ROOT/'src/data/research/fiscal-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print('Matched',sum(x['matched_cells'] for x in reports),'official source cells')
