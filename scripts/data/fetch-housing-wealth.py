"""Refresh household wealth and housing data; retain exact StatFin responses."""
import json,urllib.request,pathlib,datetime
root=pathlib.Path(__file__).resolve().parents[2]
raw={}
def fetch(ds,table,selections):
 url=f'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/{ds}/{table}.px'
 query=[{'code':k,'selection':{'filter':'item','values':v}} for k,v in selections.items()]
 req=urllib.request.Request(url,data=json.dumps({'query':query,'response':{'format':'json'}}).encode(),headers={'Content-Type':'application/json'})
 d=json.loads(urllib.request.urlopen(req,timeout=45).read());raw[table]={'url':url,'query':query,'response':d};print(table,len(d['data']),flush=True)
 keys=[c['code'] for c in d['columns'] if c['type']!='c'];cols=[c['code'] for c in d['columns'] if c['type']=='c']
 return [(dict(zip(keys,r['key'])),{c:float(v) if v not in ['.','..','...',''] else None for c,v in zip(cols,r['values'])}) for r in d['data']]
wealthYears=[1987,1988,1994,1998,2004,2009,2013,2016,2019,2023]
w=fetch('vtutk','151z',{'vtutk_varlaji_6_20200101':['nettoae_DN3001_2'],'hallintaperuste_1_20150401':['1','2','3'],'timeperiod_y':list(map(str,wealthYears)),'contentscode':['vtutk_mediaani_r']})
a=fetch('vtutk','151s',{'vtutk_varlaji_6_20200101':['nettoae_DN3001_2','asarav'],'ikakausi_6_20120501':[str(i) for i in range(1,8)],'timeperiod_y':list(map(str,wealthYears)),'contentscode':['vtutk_mediaani_r','vtutk_kotitalousosuus']})
h=fetch('tjt','12g4',{'timeperiod_y':[str(y) for y in range(2002,2025)],'hallintasuhde_3_20120501':['1','2'],'pienituloisuus_2_20131220':['ss'],'contentscode':['kvkturahamod','askpros2','asmpros2']})
wealth=[{'year':int(k['timeperiod_y']),'group':k['hallintaperuste_1_20150401'],'median':v['vtutk_mediaani_r']} for k,v in w]
ages={}
for k,v in a:
 p=ages.setdefault((int(k['timeperiod_y']),k['ikakausi_6_20120501']),{'year':int(k['timeperiod_y']),'group':k['ikakausi_6_20120501'],'median':None,'owners':None})
 if k['vtutk_varlaji_6_20200101']=='asarav':p['owners']=v['vtutk_kotitalousosuus']
 else:p['median']=v['vtutk_mediaani_r']
housing=[{'year':int(k['timeperiod_y']),'group':k['hallintasuhde_3_20120501'],'income':v['kvkturahamod'],'costShare':v['askpros2'],'expenditureShare':v['asmpros2']} for k,v in h]
out={'retrieved':datetime.date.today().isoformat(),'wealthYears':wealthYears,'wealth':wealth,'ages':list(ages.values()),'housing':housing,'sources':raw}
(root/'src/components/planeetta/housing-wealth-data.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
print(wealth[-3:]);print(housing[-2:])
