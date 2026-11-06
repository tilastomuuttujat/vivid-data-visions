"""Extract official Kela age tables without inferring eligibility or non-take-up."""
import json,hashlib,urllib.request,sys
from pathlib import Path
from html.parser import HTMLParser
from datetime import datetime,timezone
OUT=Path(__file__).with_name('sources')/'population-security'
class Tables(HTMLParser):
 def __init__(self):super().__init__();self.tables=[];self.tab=None;self.row=None;self.cell=None
 def handle_starttag(self,t,a):
  if t=='table':self.tab=[]
  if t=='tr' and self.tab is not None:self.row=[]
  if t in ['td','th'] and self.row is not None:self.cell=''
 def handle_data(self,s):
  if self.cell is not None:self.cell+=s
 def handle_endtag(self,t):
  if t in ['td','th'] and self.cell is not None:self.row.append(' '.join(self.cell.replace('\xad','').split()));self.cell=None
  if t=='tr' and self.row is not None:self.tab.append(self.row);self.row=None
  if t=='table' and self.tab is not None:self.tables.append(self.tab);self.tab=None

def extract(raw):
 p=Tables();p.feed(raw.decode());age=[t for t in p.tables if t and t[0]==['Sukupuoli','Ikäryhmä','Saajat']]
 if len(age)!=1 or len(age[0])!=37:raise ValueError('Expected official age-by-sex table')
 households=[t for t in p.tables if t and t[0][:2]==['Hyvinvointialue','Kaikki saajakotitaloudet'] and len(t[0])==7]
 if len(households)!=1:raise ValueError('Expected household table')
 national=[r for r in households[0][1:] if r[0]=='Koko maa']
 if len(national)!=1:raise ValueError('Expected national household total')
 rows=[dict(sex=r[0],age=r[1],recipients=int(r[2].replace(' ',''))) for r in age[0][1:]]
 return dict(age_by_sex=rows,household_columns=households[0][0][1:],household_national=[int(x.replace(' ','')) for x in national[0][1:]])
def main():
 OUT.mkdir(exist_ok=True)
 for year in [2024,2025]:
  url=f'https://tilastojulkaisut.tietotarjotin.fi/perustoimeentulotuki/{year}/';raw=Path(sys.argv[1],f'income-support{year}.html').read_bytes() if len(sys.argv)>1 else urllib.request.urlopen(url,timeout=90).read();data=extract(raw)
  result=dict(year=year,url=url,retrieved_at=datetime.now(timezone.utc).isoformat(),original_html_sha256=hashlib.sha256(raw).hexdigest(),locators=['Katsaus 3.4, sukupuolen ja iän mukainen kuvion taulukko','Taulukko 2, saajakotitaloudet kotitaloustyypeittäin, Koko maa'],**data)
  (OUT/(str(year)+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(year,sum(r['recipients'] for r in data['age_by_sex']),data['household_national'],flush=True)
if __name__=='__main__':main()
