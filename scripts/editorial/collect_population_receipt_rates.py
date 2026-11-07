"""Preserve Kela's published municipal percentages, not reconstructed denominators."""
import json,hashlib,sys,urllib.request
from pathlib import Path
from datetime import datetime,timezone
from collect_population_security import Tables,extract as extract_age
OUT=Path(__file__).with_name('sources')/'population-receipt-rates.json'
URL='https://tilastojulkaisut.tietotarjotin.fi/perustoimeentulotuki/2025/'
def extract(raw):
 p=Tables();p.feed(raw.decode());tables=[t for t in p.tables if t and t[0]==['Kunta','Saajat','Osuus, %']]
 if len(tables)!=1:raise ValueError('Expected one official municipal share table')
 rows=[dict(municipality=r[0],recipients=int(r[1].replace(' ','')),published_percent=float(r[2].replace(',','.'))) for r in tables[0][1:]]
 if len(rows)!=292 or len({r['municipality'] for r in rows})!=292:raise ValueError('Municipal coverage differs')
 persons=sum(r['recipients'] for r in extract_age(raw)['age_by_sex'])
 return dict(year=2025,url=URL,retrieved_at=datetime.now(timezone.utc).isoformat(),original_html_sha256=hashlib.sha256(raw).hexdigest(),locator='Katsaus 3.4, kuvio 3, Kunta / Saajat / Osuus, %; source caption: 31.12.2025',national_annual_persons=persons,rows=rows)
def main():
 raw=Path(sys.argv[1]).read_bytes() if len(sys.argv)>1 else urllib.request.urlopen(URL,timeout=90).read()
 OUT.write_text(json.dumps(extract(raw),ensure_ascii=False,indent=2)+'\n');print('Collected 292 published municipal shares; age denominators not inferred')
if __name__=='__main__':main()
