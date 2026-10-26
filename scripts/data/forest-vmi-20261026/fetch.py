"""Freeze Luke inventory and annual-flow tables including original PX footnotes."""
import concurrent.futures,datetime,hashlib,json,pathlib,urllib.parse,urllib.request
R=pathlib.Path(__file__).resolve().parent;S=R/'sources';S.mkdir(exist_ok=True)
BASE='https://statdb.luke.fi/PxWeb/api/v1/fi/LUKE/'
TABLES={
 'area':'met/zzz_lak/06 Metsavarat/1.01_Metsatalousmaa.px',
 'stock':'met/zzz_lak/06 Metsavarat/1.16_Puuston_tilavuus_metsa_ja_kitumaalla_pu.px',
 'density':'met/zzz_lak/06 Metsavarat/1.22_Puuston_keskitilavuus_metsamaalla.px',
 'growth':'met/zzz_lak/06 Metsavarat/1.24_Puuston_vuotuinen_kasvu_metsa_ja_kitu.px',
 'annual':'met/hakker/0500_hakker.px',
}
def sha(b):return hashlib.sha256(b).hexdigest()
def capture(item):
 key,path=item;url=BASE+urllib.parse.quote(path,safe='/');rec={}
 if (S/(key+'.receipt.json')).exists():return key,'cached'
 def request(suffix,query=None):
  req=urllib.request.Request(url,data=json.dumps(query,ensure_ascii=False).encode() if query else None,headers={'User-Agent':'Mozilla/5.0','Content-Type':'application/json'})
  with urllib.request.urlopen(req,timeout=40) as response:raw=response.read();resolved=response.url
  (S/(key+'.'+suffix)).write_bytes(raw);rec[suffix]={'sha256':sha(raw),'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'resolved_url':resolved};return raw
 meta=json.loads(request('metadata.json'));query={'query':[{'code':v['code'],'selection':{'filter':'item','values':v['values']}} for v in meta['variables']],'response':{'format':'json'}}
 (S/(key+'.query.json')).write_text(json.dumps(query,ensure_ascii=False,indent=2)+'\n')
 response=json.loads(request('response.json',query));query['response']['format']='px';request('response.px',query)
 (S/(key+'.receipt.json')).write_text(json.dumps({'key':key,'url':url,'files':rec,'rows':len(response['data'])},ensure_ascii=False,indent=2)+'\n')
 return key,len(response['data'])
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  for result in pool.map(capture,TABLES.items()):print(result,flush=True)
