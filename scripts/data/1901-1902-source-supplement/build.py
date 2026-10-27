#!/usr/bin/env python3
"""Generate source-specific repeatable imports and verification of previously held figures."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parent
area=[('UUSIMAA','Uudenmaan lääni',5712,1.88),('TURKU_PORI','Turun ja Porin lääni',10239,2.26),('HAME','Hämeen lääni',6499,2.13),('VIIPURI','Viipurin lääni',5983,1.39),('MIKKELI','Mikkelin lääni',5730,3.02),('KUOPIO','Kuopion lääni',9586,3.04),('VAASA','Vaasan lääni',9254,1.99),('OULU','Oulun lääni',8766,3.09),('FI','Koko maa',61769,2.25)]
assert sum(a[2] for a in area[:-1])==area[-1][2]
def series(key,title,unit,theme,variable,page,description,rows):return dict(key=key,title=title,unit=unit,theme=theme,variable=variable,page=page,description=description,rows=rows)
poor=[
series('regional_recipients','Köyhäinhoidon suorat avunsaajat lääneittäin 1901','henkilöä','Köyhyys ja sosiaaliturva',7,'teksti s. 4–5 / PDF s. 9–10','Vuoden avunsaajamäärä on lähteen mukaan likimääräinen: vuoden lopun luokkiin lisättiin vuoden aikana kuolleet, mutta osa laitoksesta aiemmin poistuneista voi puuttua. Vain nimeltä ilmoitetut suorat avunsaajat; ei kaikkia köyhiä. Historialliset läänit.',[[1901,k,n,v] for k,n,v,p in area]),
series('regional_recipients_percent','Köyhäinhoidon suorien avunsaajien osuus väestöstä lääneittäin 1901','prosenttia väestöstä','Köyhyys ja sosiaaliturva',7,'teksti s. 5 / PDF s. 10','Lähteen avunsaajamäärään perustuva osuus on likimääräinen, ei yleinen köyhyysaste. Historialliset lääni- ja valtiorajat.',[[1901,k,n,p] for k,n,v,p in area]),
series('institution_residents','Vaivaishoitolaitosten hoidokit vuoden lopussa 1901','henkilöä','Köyhyys ja sosiaaliturva',7,'teksti s. 2–3 / PDF s. 7–8','Sisältää Sortavalan yksityiseen diakonialaitokseen sijoitetut, vaikka laitos itse ei ole kunnallinen. Lähde varoittaa, että joitain ennen vuoden loppua poistuneita saattoi olla mukana.',[[1901,'CITY','Kaupungit',2211],[1901,'RURAL','Maaseutu',5143],[1901,'FI','Koko maa',7354]]),
series('recipient_settlement','Köyhäinhoidon suorat avunsaajat kaupungin ja maaseudun mukaan 1901','henkilöä','Köyhyys ja sosiaaliturva',7,'teksti s. 4 / PDF s. 9','Likimääräinen vuosisumma: vuoden lopun avunsaajat ja vuoden aikana kuolleet; osa vuoden aikana laitoksista poistuneista voi puuttua. Alaryhmät sisältyvät koko maan lukuun.',[[1901,'CITY','Kaupungit',8044],[1901,'RURAL','Maaseutu',53725],[1901,'FI','Koko maa',61769]])]
groups=[('BOOK_RYE','Kirjanpidon ruis',[338143,347591]),('BOOK_BARLEY','Kirjanpidon ohra',[210728,218702]),('BOOK_OATS','Kirjanpidon kaura',[126239,107845]),('PHYSICAL_RYE','Makasiineissa ruis',[200073,123734]),('PHYSICAL_BARLEY','Makasiineissa ohra',[118829,96851]),('PHYSICAL_OATS','Makasiineissa kaura',[85899,35231])]
assert all(groups[i+3][2][j]<=groups[i][2][j] for i in range(3) for j in range(2))
annual=[series('granary_stock','Pitäjänmakasiinien varastot vuoden lopussa 1901–1902','hehtolitraa','Ruokahuolto ja kriisivarautuminen',12,'taulu 142, painettu s. 224 / PDF s. 194','Makasiinissa olleet sisältyvät kirjanpidon varastoon, eikä lukuja summata. Historiallinen Suomi.',[[1901+i,k,n,v] for k,n,vals in groups for i,v in enumerate(vals)])]
sources=[('poor1901','Köyhäinhoito Suomessa vuonna 1901 (1905)','https://otos.stat.fi/bitstreams/e8bb4326-7d2e-40ee-a666-afd737d7245f/download','98b686931261decedbf1337e48ba621dad27a6c0ef856305cebc9e727fb03f4e',poor),('yearbook1904','Suomen tilastollinen vuosikirja 1904','https://otos.stat.fi/items/d86060fc-afde-4d0d-a7c1-423a10a31731','f5970c2f72d65ec1270ac6a4744158e227c2a2261965a0e8d9b94cd7e24c6a12',annual)]
template=(R/'import-template.sql').read_text()
for key,title,url,sha,ss in sources:
 p={'batch_id':'source_supplement_'+key+'_20261027_v1','source_title':title,'source_url':url,'source_sha256':sha,'series':ss}
 p['content_sha256']=hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 (R/(key+'.json')).write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
 payload=json.dumps(p,ensure_ascii=False,separators=(',',':'));assert '$payload$' not in payload
 sql=template.replace('__PAYLOAD__',payload).replace('__COUNT_SERIES__',str(len(ss))).replace('__COUNT_ROWS__',str(sum(len(a['rows']) for a in ss))).replace('__PREFIX__','fi.supplement.'+key+'.')
 (R/(key+'.sql')).write_text(sql)
 print(key,len(ss),sum(len(a['rows']) for a in ss))
