"""Recheck the existing atlas inputs against original official API responses."""
import json,urllib.request,hashlib
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).with_name('sources')/'population-work'
def main():
 for tab,path in [('115w','src/components/kokonaiskuva/employment-age-data.json'),('15ai','src/components/erotus-tuotanto/production-data.json')]:
  pinned=json.loads((ROOT/path).read_text());s=pinned['source'];q=s['query'];q=q if isinstance(q,dict) else {'query':q,'response':{'format':'json'}}
  req=urllib.request.Request(s['url'],data=json.dumps(q).encode(),headers={'Content-Type':'application/json'})
  raw=urllib.request.urlopen(req,timeout=60).read();j=json.loads(raw)
  (OUT/(tab+'.json')).write_bytes(raw)
  receipt={'url':s['url'],'query':q,'retrieved_at':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'existing_atlas_path':path,'existing_atlas_sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),'original_query_response_sha256':s['sha256']}
  (OUT/(tab+'.receipt.json')).write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(tab,'original response collected',flush=True)
if __name__=='__main__':main()
