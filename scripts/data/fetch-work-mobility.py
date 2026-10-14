"""Municipal-boundary commuting, aggregated by residence region (2026)."""
import urllib.request,json,pathlib,hashlib,datetime
ROOT=pathlib.Path(__file__).resolve().parents[2]
regions=json.loads((ROOT/'src/components/planeetta/work-opportunity-data.json').read_text())['regions'];ids=[r['id'] for r in regions]
u='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/tyokay/115n.px'
m=json.load(urllib.request.urlopen(u,timeout=90));q=[]
select={'pendel_3_20130101':['SSS','1','2'],'koulutusaste_17_20180101':['SSS'],'timeperiod_y':[str(y) for y in range(1987,2025)],'ikaryhma_10_20180101':['SSS'],'contentscode':['tyokay-tyolliset2']}
for v in m['variables']:
 c=v['code'];q.append({'code':c,'selection':{'filter':'agg:_Maakunnat 2026.agg' if c.startswith('alue_') else 'item','values':ids if c.startswith('alue_') else select[c]}})
raw=urllib.request.urlopen(urllib.request.Request(u,data=json.dumps({'query':q,'response':{'format':'json'}}).encode(),headers={'Content-Type':'application/json'}),timeout=120).read();a=json.loads(raw)
keys=[c['code'] for c in a['columns'] if c['type']!='c'];points={}
for row in a['data']:
 k=dict(zip(keys,row['key']));key=(k['alue_23_20260101'],int(k['timeperiod_y']));p=points.setdefault(key,[None]*3);p[{'SSS':0,'1':1,'2':2}[k['pendel_3_20130101']]]=None if row['values'][0] in ['.','..','...',''] else int(row['values'][0])
for k,p in points.items():assert all(v is not None for v in p) and p[0]==p[1]+p[2],(k,p)
out={'retrieved':datetime.date.today().isoformat(),'source':{'url':u,'query':q,'sha256':hashlib.sha256(raw).hexdigest(),'metadata':a.get('metadata',[])},'columns':['region','year','employedAllAges','outsideHomeMunicipality','withinHomeMunicipality'],'points':[[*k,*p] for k,p in points.items()]}
(ROOT/'src/components/planeetta/work-mobility-data.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n');print(len(points),'balanced observations')
