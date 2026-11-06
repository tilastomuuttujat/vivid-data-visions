"""Pin official observations and a separate 2024 projection, without interpolation."""
import json,urllib.request,hashlib
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).with_name('sources')/'population-foundation'
BASE='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/'
def fetch(url,query=None):
 req=urllib.request.Request(url,data=json.dumps(query).encode() if query else None,headers={'Content-Type':'application/json'})
 return urllib.request.urlopen(req,timeout=60).read()
def main():
 ROOT.mkdir(exist_ok=True)
 for tab,path,start,end,kind in [('12dx','synt',1850,2025,'observed'),('12dt','synt',1850,2025,'observed'),('11rc','vaerak',1865,2025,'observed'),('11ra','vaerak',1990,2025,'observed'),('128t','vaenn',2026,2050,'projection_2024')]:
  url=BASE+path+'/'+tab+'.px';meta=fetch(url);m=json.loads(meta);choices={}
  for v in m['variables']:
   code=v['code'];values=v['values']
   if code=='timeperiod_y':values=[x for x in values if start<=int(x)<=end]
   elif code.startswith('sukupuoli'):values=['SSS']
   elif code.startswith('alue_'):values=['SSS']+[x for x in values if x.startswith('MK')]
   elif code=='contentscode':
    if tab=='12dx':values=['synt-vm01','synt-vm11','synt-luonvalisays','synt-vm41','synt-vm42','synt-vm4142','synt-kokmuutos','synt-vaesto']
    elif tab=='11ra':values=['vaerak-vaesto','vaesto_alle15_p','vaesto_15_64_p','vaesto_yli64_p','vaerak-dem_huoltos','vaesto_svaltio_ulk','vaesto_svaltio_ulk_p']
    elif tab=='128t':values=['vaesto_e24']
   choices[code]=values
  query={'query':[{'code':k,'selection':{'filter':'item','values':v}} for k,v in choices.items()],'response':{'format':'json'}}
  raw=fetch(url,query);j=json.loads(raw)
  if not j.get('data'):raise ValueError('Empty official response')
  (ROOT/(tab+'.json')).write_bytes(raw);(ROOT/(tab+'.metadata.json')).write_bytes(meta)
  receipt={'table':tab,'url':url,'query':query,'kind':kind,'projection_vintage':2024 if kind.startswith('projection') else None,'retrieved_at':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'metadata_sha256':hashlib.sha256(meta).hexdigest(),'cells':sum(len(x['values']) for x in j['data'])}
  (ROOT/(tab+'.receipt.json')).write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(tab,receipt['cells'],flush=True)
if __name__=='__main__':main()
