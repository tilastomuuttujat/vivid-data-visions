"""Collect exact school-age cohorts and actual grade counts, never attendance rates."""
import json,urllib.request,hashlib
from pathlib import Path
from datetime import datetime,timezone
OUT=Path(__file__).with_name('sources')/'population-education';BASE='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/'
def fetch(url,q=None):return urllib.request.urlopen(urllib.request.Request(url,data=json.dumps(q).encode() if q else None,headers={'Content-Type':'application/json'}),timeout=60).read()
def main():
 for name,table,path in [('age-national','11re','vaerak'),('age-municipal','11re','vaerak'),('pupils','133w','opiskt')]:
  url=BASE+path+'/'+table+'.px';rawmeta=fetch(url);m=json.loads(rawmeta);choices={}
  for v in m['variables']:
   code=v['code'];values=['SSS']
   if code=='contentscode':values=v['values']
   elif code=='timeperiod_y':values=['1990','2025'] if name=='age-municipal' else v['values']
   elif code.startswith('alue_'):values=v['values'] if name=='age-municipal' else ['SSS']
   elif code.startswith('ikaryhma_'):values=[str(a).zfill(3) for a in range(7,16)]
   elif code.startswith('vluokka_'):values=[str(a).zfill(2) for a in range(1,10)]
   choices[code]=values
  q={'query':[{'code':c,'selection':{'filter':'item','values':v}} for c,v in choices.items()],'response':{'format':'json'}};raw=fetch(url,q);j=json.loads(raw)
  (OUT/(name+'.json')).write_bytes(raw);(OUT/(name+'.metadata.json')).write_bytes(rawmeta)
  receipt={'url':url,'query':q,'retrieved_at':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'metadata_sha256':hashlib.sha256(rawmeta).hexdigest(),'cells':sum(len(x['values']) for x in j['data'])}
  (OUT/(name+'.receipt.json')).write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(name,receipt['cells'],flush=True)
if __name__=='__main__':main()
