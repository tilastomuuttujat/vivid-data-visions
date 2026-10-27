#!/usr/bin/env python3
import json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parent
def seq(key,title,desc,rows,period=False):return dict(key=key,title=title,unit='henkilöä',theme='Muuttoliike',variable=1,page='liite s. 159 / PDF s. 171' if period else 'liite s. 160 / PDF s. 172',description=desc,rows=rows,period=period)
def annual(groups):return [[y,k,n,v] for k,n,vals in groups for y,v in zip(range(1980,1988),vals)]
periods=[('1870–1874',1874,1473,1839),('1875–1879',1879,698,1009),('1880–1884',1884,7380,13039),('1885–1889',1889,16425,22324),('1890–1894',1894,27972,32784),('1895–1899',1899,26663,28276)]
s=[seq('emigration_citizens','Maastamuuttaneet Suomen kansalaiset 1980–1987','Suomen kansalaisten maastamuutto; Ruotsi on kaikkien maiden osajoukko. Teoksen lähde SVT VI A 1980–87 osa 1; 1987 ennakkotieto. Ei kaikkien kansalaisuuksien maastamuutto.',annual([('WORLD','Kaikki maat',[13991,9047,6506,5860,6559,6777,7056,7291]),('SWEDEN','Ruotsi',[11033,6533,4267,3752,4268,4417,4813,4752])])),
seq('immigration_citizens','Maahanmuuttaneet Suomen kansalaiset 1980–1987','Suomen kansalaisten maahanmuutto; Ruotsi on kaikkien maiden osajoukko. Teoksen lähde SVT VI A 1980–87 osa 1; 1987 ennakkotieto. Ei koko maahanmuutto.',annual([('WORLD','Kaikki maat',[11702,13521,12278,10817,8979,7875,7212,6344]),('SWEDEN','Ruotsi',[9617,11490,10334,8807,7040,6182,5462,4562])])),
seq('long_distance_period','Kaukosiirtolaisuuden viisivuotissummat lähdetyypin mukaan 1870–1899','Lähteen passiluetteloihin ja matkustajaluetteloihin perustuvat arviot ovat vaihtoehtoisia, niitä ei summata. Viisivuotissumma ankkuroitu jakson viimeiseen vuoteen, ei vuosihavainto. Julkaisematon kunnes periodituki ja alkuperäiset lähteet tarkistettu.',[[end,k,label,(pv if k=='PASS' else tv),period] for period,end,pv,tv in periods for k,label in [('PASS','Passiluetteloiden mukaan'),('PASSENGER','Matkustajaluetteloiden mukaan')]],True)]
assert sum(len(x['rows']) for x in s)==44
assert sum(r[3] for r in s[0]['rows'] if r[1]=='SWEDEN')==43835
assert sum(r[3] for r in s[1]['rows'] if r[1]=='SWEDEN')==63494
p={'batch_id':'korkiasaari_1989_migration_selected_20261027_v1','source_title':'Jouni Korkiasaari: Suomalaiset maailmalla (1989)','source_url':'https://www.doria.fi/handle/10024/180068','source_sha256':'74150d3f968698bbea797ee1cb64029ac8a8ae744dcf7b02474006af0eba4c18','series':s}
p['content_sha256']=hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
(R/'batch.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
payload=json.dumps(p,ensure_ascii=False,separators=(',',':'));assert '$payload$' not in payload
(R/'import.sql').write_text((R/'template.sql').read_text().replace('__PAYLOAD__',payload))
print('3 sarjaa, 44 havaintoa; 12 jaksosummaa odottaa')
