"""Fetch bounded official PxWeb extracts with exact queries and response digests."""
import urllib.request,json,hashlib,pathlib,itertools,datetime
ROOT=pathlib.Path(__file__).resolve().parents[2]
def get(url,payload=None):
 req=urllib.request.Request(url,data=json.dumps(payload).encode() if payload else None,headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=60) as r: raw=r.read()
 return json.loads(raw),hashlib.sha256(raw).hexdigest()
def fetch(name,url,choices):
 meta,_=get(url);variables=meta['variables'];query=[]
 for v in variables:
  vals=choices[v['code']]
  if vals=='all':vals=v['values']
  assert all(x in v['values'] for x in vals),(v['code'],vals)
  query.append(dict(code=v['code'],selection=dict(filter='item',values=vals)))
 request=dict(query=query,response=dict(format='json-stat2'));result,digest=get(url,request)
 ids=result['id'];sizes=result['size'];dims=result['dimension']; categories=[]
 for d in ids:
  idx=dims[d]['category']['index'];categories.append([k for k,v in sorted(idx.items(),key=lambda kv:kv[1])])
 values=result['value'];rows=[]
 for i,keys in enumerate(itertools.product(*categories)):
  v=values[i] if isinstance(values,list) else values.get(str(i))
  rows.append(dict(dimensions=dict(zip(ids,keys)),value=v))
 return dict(name=name,url=url,request=request,response_sha256=digest,metadata=meta,response_updated=result.get('updated'),dimensions=dims,rows=rows)
if __name__=='__main__':
 income='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/tjt/14k5.px';wages='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/pra/15aw.px'
 common={'timeperiod_y':'all','tuloluokka_46_19951231':['SSS'],'ikaryhma_22_20191201':['18-64','25-34','35-49','50-64'],'sukupuoli_9_20180101':['SSS','1','2'],'koulutusaste_21_20231110':['SSS','3','456','78','9'],'contentscode':'all'}
 extracts=[fetch('income',income,common)]
 wage_choices={'timeperiod_y':'all','palk_muo_1_20250101':['SSS'],'koulutusaste_17_20180101':'all','koulutusala_3_20180101':['SSS','07','09'],'ikaryhma_10_20180101':['SSS','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64'],'sukupuoli_9_20180101':['SSS','1','2'],'contentscode':['koko_psaaja_lkm','koko_psaaja_kans_ka','koko_psaaja_kans_med']}
 extracts.append(fetch('wages2024',wages,wage_choices))
 payload=dict(retrieved_on=str(datetime.date.today()),extracts=extracts)
 (ROOT/'src/data/research/education-income-source.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n')
 print([(e['name'],len(e['rows']),sum(r['value'] is None for r in e['rows'])) for e in extracts])
