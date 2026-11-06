"""Retrieve two fixed historical references; never changes article/source databases."""
import json,urllib.request,hashlib
from pathlib import Path
from datetime import datetime,timezone
URL='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ntp/15ai.px'
def main():
 for name,start,end,sectors,transaction,unit in [('labour-years-1860-1959',1860,1959,['SSS','A','BTE','F','GTT'],'E2','ntp-TWY'),('public-volume-1860-1945',1860,1945,['SSS'],'P3KS13','ntp-VOLIND')]:
  choices={'timeperiod_y':[str(y) for y in range(start,end+1)],'toimiala_79_20180101':sectors,'taloustoimi_1_20180101':[transaction],'contentscode':[unit]}
  q={'query':[{'code':k,'selection':{'filter':'item','values':v}} for k,v in choices.items()],'response':{'format':'json'}}
  raw=urllib.request.urlopen(urllib.request.Request(URL,data=json.dumps(q).encode(),headers={'Content-Type':'application/json'}),timeout=60).read()
  p=Path(__file__).with_name('sources')/('matrix15ai-'+name+'.json');p.write_bytes(raw)
  p.with_suffix('.receipt.json').write_text(json.dumps({'url':URL,'query':q,'sha256':hashlib.sha256(raw).hexdigest(),'retrieved_at':datetime.now(timezone.utc).isoformat()},ensure_ascii=False,indent=2)+'\n')
  print(name,len(json.loads(raw)['data']))
if __name__=='__main__':main()
