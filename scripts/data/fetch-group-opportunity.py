"""Reproducible group cross-sections, not individual transition probabilities."""
import json,urllib.request,pathlib,hashlib,datetime
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'src/components/planeetta/group-opportunity-data.json'
def fetch(ds,table,select):
 url=f'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/{ds}/{table}.px'
 meta=json.load(urllib.request.urlopen(url,timeout=90))
 q=[{'code':v['code'],'selection':{'filter':'item','values':select.get(v['code'],v['values'])}} for v in meta['variables']]
 raw=urllib.request.urlopen(urllib.request.Request(url,data=json.dumps({'query':q,'response':{'format':'json'}}).encode(),headers={'Content-Type':'application/json'}),timeout=120).read()
 a=json.loads(raw);keys=[c['code'] for c in a['columns'] if c['type']!='c'];measures=[c['code'] for c in a['columns'] if c['type']=='c']
 rows=[(dict(zip(keys,r['key'])),dict(zip(measures,[None if x in ('.','..','...','') else float(x) for x in r['values']]))) for r in a['data']]
 print(table,len(rows),flush=True)
 return meta,rows,{'url':url,'query':q,'sha256':hashlib.sha256(raw).hexdigest(),'metadata':a.get('metadata',[])}
common={'paaasial_toimin_3_20180101':['SSS','11','12','21-99','22'],'sukupuoli_9_20180101':['SSS'],'contentscode':['tyokay-vaesto']}
m,edu,s1=fetch('tyokay','115d',dict(common,ikaryhma_10_20180101=['18-64']))
agecodes=['18-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64']
_,age,s2=fetch('tyokay','115w',dict(common,ikaryhma_10_20180101=agecodes))
_,inc,s3=fetch('tjt','14k5',{'tuloluokka_46_19951231':['SSS','060'],'ikaryhma_22_20191201':['18-64'],'sukupuoli_9_20180101':['SSS'],'koulutusaste_21_20231110':['SSS','3','456','78','9'],'contentscode':['tjt-henkiloita','tjt-ekvikturaha_med']})
regions=[{'id':v,'name':t.replace(v+' ','')} for v,t in zip(m['variables'][0]['values'],m['variables'][0]['valueTexts'])]
fields={'SSS':0,'11':1,'12':2,'21-99':3,'22':4}
def bundle(rows,groupvar):
 points={}
 for k,v in rows:
  key=(k['alue_28_20250101'],k[groupvar],int(k['timeperiod_y']))
  points.setdefault(key,[None]*5)[fields[k['paaasial_toimin_3_20180101']]]=v['tyokay-vaesto']
 for key,p in points.items():
  assert all(x is not None for x in p),key
  assert p[0]==sum(p[1:4]),(key,p)
 return [[*key,*p] for key,p in points.items()]
income={}
for k,v in inc:
 key=(k['koulutusaste_21_20231110'],int(k['timeperiod_y']))
 p=income.setdefault(key,[None]*3)
 if k['tuloluokka_46_19951231']=='SSS':p[0]=v['tjt-henkiloita'];p[2]=v['tjt-ekvikturaha_med']
 else:p[1]=v['tjt-henkiloita']
for k,p in income.items():assert p[0] is not None and p[1] is not None and p[1]<=p[0]
output={'retrieved':datetime.date.today().isoformat(),'through':2024,'sources':{'115d':s1,'115w':s2,'14k5':s3},'regions':regions,'employmentColumns':['region','group','year','population','employed','unemployed','outside','students'],'education':bundle(edu,'koulutusaste_17_20180101'),'age':bundle(age,'ikaryhma_10_20180101'),'incomeColumns':['education','year','population','poor','equivalizedMedian2024Euro'],'income':[[*key,*p] for key,p in income.items()]}
OUT.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
print('Saved',OUT.stat().st_size,flush=True)
