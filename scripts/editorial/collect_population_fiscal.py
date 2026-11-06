"""Pin consolidated COFOG spending; preserve missing detailed pre-2001 values."""
import json,urllib.request,hashlib
from pathlib import Path
from datetime import datetime,timezone
URL='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/jmete/12a6.px';OUT=Path(__file__).with_name('sources')/'population-fiscal'
FUNCTIONS=['SSS']+['G'+str(i).zfill(2) for i in range(1,11)]+['G10'+str(i).zfill(2) for i in range(1,10)]
def fetch(q=None):return urllib.request.urlopen(urllib.request.Request(URL,data=json.dumps(q).encode() if q else None,headers={'Content-Type':'application/json'}),timeout=60).read()
def main():
 OUT.mkdir(exist_ok=True);meta=fetch();m=json.loads(meta);q={'query':[],'response':{'format':'json'}}
 for v in m['variables']:
  k=v['code'];values=v['values']
  if k.startswith('sektori'):values=['S13']
  elif k.startswith('taloustoimi'):values=['OTES']
  elif k.startswith('julkisyht'):values=FUNCTIONS
  q['query'].append({'code':k,'selection':{'filter':'item','values':values}})
 raw=fetch(q);j=json.loads(raw);(OUT/'12a6.json').write_bytes(raw);(OUT/'12a6.metadata.json').write_bytes(meta)
 r=dict(url=URL,query=q,retrieved_at=datetime.now(timezone.utc).isoformat(),sha256=hashlib.sha256(raw).hexdigest(),metadata_sha256=hashlib.sha256(meta).hexdigest(),cells=sum(len(x['values']) for x in j['data']),provisional_years=[2024],detailed_functions_start=2001,sector='S13',transaction='OTES')
 (OUT/'12a6.receipt.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print('Collected consolidated COFOG',r['cells'],'source cells',flush=True)
if __name__=='__main__':main()
