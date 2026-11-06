"""Reproducible, public StatFin references for two bounded article comparisons."""
import json,urllib.request,hashlib
from datetime import datetime,timezone
from pathlib import Path
URL='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ntp/15ai.px'
OUT=Path(__file__).with_name('sources')
def fetch():
    meta_raw=urllib.request.urlopen(URL,timeout=60).read();meta=json.loads(meta_raw)
    configs=[('work-1960-1974',range(1960,1975),['SSS','A','BTE','F','GTT'],'E1','ntp-TP'),('public-consumption-1946-1959',range(1946,1960),['SSS'],'P3KS13','ntp-VOLIND')]
    for name,years,sectors,transaction,unit in configs:
        choices={'timeperiod_y':[str(y) for y in years],'toimiala_79_20180101':sectors,'taloustoimi_1_20180101':[transaction],'contentscode':[unit]}
        for v in meta['variables']:
            if not set(choices[v['code']])<=set(v['values']):raise ValueError('Source dimension changed')
        query={'query':[{'code':v['code'],'selection':{'filter':'item','values':choices[v['code']]}} for v in meta['variables']],'response':{'format':'json'}}
        req=urllib.request.Request(URL,data=json.dumps(query).encode(),headers={'Content-Type':'application/json'})
        raw=urllib.request.urlopen(req,timeout=60).read();data=json.loads(raw)
        path=OUT/('article15ai-'+name+'.json');path.write_bytes(raw)
        receipt={'url':URL,'retrieved_at':datetime.now(timezone.utc).isoformat(),'query':query,'sha256':hashlib.sha256(raw).hexdigest(),'metadata_sha256':hashlib.sha256(meta_raw).hexdigest(),'dimensions':meta['variables'],'note':meta.get('note',[])}
        path.with_suffix('.receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
        print(name,'rows',len(data['data']),'sha256',receipt['sha256'])
if __name__=='__main__':fetch()
