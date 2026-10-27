#!/usr/bin/env python3
import json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parent
def seq(key,title,unit,theme,var,page,desc,rows,school=False):return dict(key=key,title=title,unit=unit,theme=theme,variable=var,page=page,description=desc,rows=rows,school=school)
s=[seq('savings_banks','Säästöpankkien määrä kaupungeissa ja maaseudulla','säästöpankkia','Rahoitus ja säästäminen',18,'taulu 144, s. 227 / PDF s. 197','Kaupunki ja maaseutu sisältyvät koko maan määrään. Pankkien määrä ei kuvaa säästäjien lukumäärää. Historiallinen aluerajaus.',[[1850,'FI','Koko maa',11],[1860,'FI','Koko maa',24],[1870,'FI','Koko maa',35],[1880,'FI','Koko maa',107],[1890,'FI','Koko maa',138],[1900,'FI','Koko maa',193],[1901,'FI','Koko maa',212],[1901,'CITY','Kaupungit',34],[1901,'RURAL','Maaseutu',178],[1902,'FI','Koko maa',242],[1902,'CITY','Kaupungit',36],[1902,'RURAL','Maaseutu',206]]),
seq('savings_passbooks','Säästöpankkikirjojen lukumäärä','pankkikirjaa','Rahoitus ja säästäminen',18,'taulu 144, s. 227 / PDF s. 197','Pankkikirjojen lukumäärä ei välttämättä vastaa yksittäisten säästäjien lukumäärää; alueet sisältyvät kokonaisuuteen.',[[1901,'FI','Koko maa',148909],[1901,'CITY','Kaupungit',99723],[1901,'RURAL','Maaseutu',49186],[1902,'FI','Koko maa',157410],[1902,'CITY','Kaupungit',103302],[1902,'RURAL','Maaseutu',54108]]),
seq('rural_primary_schools','Ylemmät kansakoulut maalaiskunnissa 1901–1902','koulua','Koulutus',4,'taulu 187, s. 292 / PDF s. 242','Lukuvuosi 1901–1902, ei kalenterivuosihavainto. Vuosi 1902 on pääteankkuri; odottaa lukuvuosien esitystavan tarkistusta.',[[1902,'FI','Koko maan maalaiskunnat',1998]],True),
seq('rural_primary_teachers','Ylempien kansakoulujen opettajat maalaiskunnissa 1901–1902','opettajaa','Koulutus',4,'taulu 187, s. 292 / PDF s. 242','Lukuvuosi 1901–1902; vuosi 1902 on pääteankkuri. Ei kaikkien kouluasteiden opettajamäärä.',[[1902,'FI','Koko maan maalaiskunnat',2346]],True),
seq('rural_primary_pupils','Ylempien kansakoulujen oppilaat maalaiskunnissa 1901–1902','oppilasta','Koulutus',4,'taulu 187, s. 292 / PDF s. 242','Lukuvuosi 1901–1902; vuosi 1902 on pääteankkuri. Ei koko ikäluokan eikä kaikkien koulumuotojen oppilasmäärä.',[[1902,'FI','Koko maan maalaiskunnat',88963]],True)]
assert len(s)==5 and sum(len(x['rows']) for x in s)==21
p={'batch_id':'yearbook_1904_savings_school_20261027_v1','source_title':'Suomen tilastollinen vuosikirja 1904','source_url':'https://otos.stat.fi/items/d86060fc-afde-4d0d-a7c1-423a10a31731','source_sha256':'f5970c2f72d65ec1270ac6a4744158e227c2a2261965a0e8d9b94cd7e24c6a12','series':s}
p['content_sha256']=hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
(R/'batch.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
payload=json.dumps(p,ensure_ascii=False,separators=(',',':'));assert '$payload$' not in payload
sql=(R/'template.sql').read_text().replace('__PAYLOAD__',payload)
(R/'import.sql').write_text(sql)
print('5 sarjaa, 21 havaintoa, kolme lukuvuosisummaa tarkistustilassa')
