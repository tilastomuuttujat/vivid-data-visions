"""Check all declared historical sources; availability is not numerical verification."""
import collections,concurrent.futures,datetime,hashlib,json,pathlib,re,urllib.request
R=pathlib.Path(__file__).resolve().parent
from snapshot_inputs import ensure_snapshot_inputs
ensure_snapshot_inputs(R)
ind=json.loads((R/'indicators.json').read_text());fin=json.loads((R/'sources.json').read_text())
urls=collections.defaultdict(lambda:dict(series_keys=[],source_keys=[],expected_pdf_sha256=[]))
for s in ind:
 u=s.get('source_url')
 if u:
  urls[u]['series_keys'].append(s['series_key']);m=s.get('metadata') or {}
  if 'pdf' in u.lower() or 'bitstream' in u.lower() or 'article/download' in u:
   for k in ('source_sha256','pdf_sha256','source_file_sha256'):
    if m.get(k):urls[u]['expected_pdf_sha256'].append(m[k])
for s in fin:
 if s.get('source_url'):
  x=urls[s['source_url']];x['source_keys'].append(s['source_key'])
  if s.get('source_sha256'):x['expected_pdf_sha256'].append(s['source_sha256'])
urls['https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ntp/15ai.px']['series_keys'] += [s['series_key'] for s in ind if (s.get('metadata') or {}).get('table')=='15ai']
def check(item):
 u,refs=item;o={'url':u,**refs,'checked_on':'2026-10-26'}
 try:
  req=urllib.request.Request(u,headers={'User-Agent':'Historical-data-review/1.0'})
  with urllib.request.urlopen(req,timeout=22) as f:
   data=f.read(45*1024*1024+1);o.update(status=f.status,final_url=f.url,content_type=f.headers.get('Content-Type'),last_modified=f.headers.get('Last-Modified'))
  if len(data)>45*1024*1024:raise ValueError('body exceeds 45MiB review limit')
  o.update(reachable=True,bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
  expected=set(o.pop('expected_pdf_sha256'))
  o['binary_comparison']='not_comparable' if not data.startswith(b'%PDF') or not expected else 'matches_existing_pdf' if o['sha256'] in expected else 'different_bytes_requires_review'
  o['expected_pdf_hashes']=sorted(expected)
  if data.startswith(b'%PDF'):pass
  elif 'criminalstatistics.fi' in u:
   text=data.decode('utf-8',errors='replace');m=re.search(r'Current version\s*([^<\n]+)',text);o['advertised_version']=m.group(1).strip() if m else None
  elif '15ai.px' in u and '/api/' in u:
   meta=json.loads(data);(R/'statfin15ai-current-metadata.json').write_bytes(data);o['variables']=[dict(code=v['code'],text=v['text'],values=len(v['values'])) for v in meta['variables']]
  o['numeric_revision_verified']=False
 except Exception as e:o.update(reachable=False,error=str(e));o.pop('expected_pdf_sha256',None)
 return o
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(check,sorted(urls.items())))
(R/'source-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'urls':len(results),'reachable':sum(x['reachable'] for x in results),'binary':dict(collections.Counter(x.get('binary_comparison','failed') for x in results)),'failed':[x['url'] for x in results if not x['reachable']]},ensure_ascii=False))
