"""Refresh StatFin central/general government annual finance series."""
import json,urllib.request,pathlib,datetime
root=pathlib.Path(__file__).resolve().parents[2];raw={};rows={}
for ds,table,selections in [
 ('ntp','15ah',{'sektoriluokitus_7_20230101':['S1311','S13'],'taloustoimi_1_20180101':['OTRS','OTES','OTRU','OTEU','B9','D411K'],'contentscode':['ntp-cp','ntp-bkt_suhde']}),
 ('jali','122g',{'sektoriluokitus_7_20230101':['S1311','S13'],'contentscode':['jali-D','Ratio_D','jali-B','Ratio_B']})]:
 url=f'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/{ds}/{table}.px';selections['timeperiod_y']=[str(y) for y in range(1980,2025)]
 query=[{'code':k,'selection':{'filter':'item','values':v}} for k,v in selections.items()]
 req=urllib.request.Request(url,data=json.dumps({'query':query,'response':{'format':'json'}}).encode(),headers={'Content-Type':'application/json'})
 d=json.loads(urllib.request.urlopen(req,timeout=45).read());raw[table]={'url':url,'query':query,'response':d}
 keys=[c['code'] for c in d['columns'] if c['type']!='c'];cols=[c['code'] for c in d['columns'] if c['type']=='c']
 for entry in d['data']:
  k=dict(zip(keys,entry['key']));p=rows.setdefault((k['sektoriluokitus_7_20230101'],int(k['timeperiod_y'])),{'year':int(k['timeperiod_y'])})
  for c,v in zip(cols,entry['values']):
   field=(k['taloustoimi_1_20180101']+'_'+c) if table=='15ah' else c
   p[field]=float(v) if v not in ['.','..','...',''] else None
 print(table,len(d['data']),flush=True)
# Valtiokonttori figures reproduced by Veronmaksajain Keskusliitto, retrieved 13 October 2026.
amounts=[3022,3717,5087,6412,7445,7902,8745,9841,9769,8899,9593,14204,27849,43030,51722,60121,66121,69770,69796,68052,63435,61760,59253,63320,63788,60000,58859,56068,54382,64281,75152,79661,83910,89738,95129,99807,102352,105773,104973,106368,124833,128696,141628,156172,169414]
ratios=[9,9.8,11.9,13.4,13.9,13.6,13.9,14.5,12.7,10.4,10.5,16.3,32.8,50.2,57,61,64.8,63,58,53.6,46.6,42.8,40,41.7,40.2,36.5,34.1,30,28,35.4,39.9,40.3,41.9,44.1,46.2,47.5,47.5,47.1,45.3,44.6,52.8,51.7,53.2,57.2,61.4]
assert len(amounts)==len(ratios)==45
out={'retrieved':datetime.date.today().isoformat(),'sectors':[{'id':s,'name':n,'points':[rows[s,y] for y in range(1980,2025)]} for s,n in [('S1311','Valtionhallinto'),('S13','Julkisyhteisöt yhteensä')]],'treasury':{'source':'https://www.veronmaksajat.fi/tutkimus-ja-tilastot/suomen-verot-ja-menot/julkisyhteisojen-ja-valtion-velka/','attribution':'Valtiokonttori, Veronmaksajain Keskusliiton koostetaulukon kautta','points':[{'year':y,'millionEuros':a,'gdpRatio':r} for y,a,r in zip(range(1980,2025),amounts,ratios)]},'sources':raw}
(root/'src/components/planeetta/public-debt-data.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
print(out['sectors'][0]['points'][-1])
