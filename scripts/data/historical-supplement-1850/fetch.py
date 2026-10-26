"""Freeze three sources. Reuse downloaded bytes only for initial audited capture.

No workbook is edited. XLSX cell values are read directly from OOXML to retain
the stored numeric strings. Stata doubles use 17 significant digits to round-trip.
"""
import csv,datetime,hashlib,io,json,pathlib,sys,urllib.request,zipfile,xml.etree.ElementTree as ET
import pandas as pd
R=pathlib.Path(__file__).resolve().parent;D=R/'sources';D.mkdir(exist_ok=True)
JST='https://www.macrohistory.net/app/download/9834512469/JSTdatasetR6.dta?t=1720600177'
JSTDOC='https://www.macrohistory.net/app/download/9834516169/JST_documentationR6.pdf?t=1676279836'
WOOD='https://pxhopea2.stat.fi/sahkoiset_julkaisut/vuosikirja2025/data/vuosikirja_2025_maatalous_21.xlsx'
CPI='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/khi/11xy.px'
Q={'query':[{'code':'timeperiod_y','selection':{'filter':'item','values':[str(y) for y in range(1860,2026)]}},{'code':'contentscode','selection':{'filter':'item','values':['khi-pisteluku']}}],'response':{'format':'json'}}
def sha(b):return hashlib.sha256(b).hexdigest()
def get(url,local,query=None):
 p=pathlib.Path('/tmp/history-'+local)
 if '--reuse-downloads' not in sys.argv or not p.exists():
  req=urllib.request.Request(url,data=json.dumps(query).encode() if query else None,headers={'User-Agent':'Mozilla/5.0','Content-Type':'application/json'})
  with urllib.request.urlopen(req,timeout=40) as response:p.write_bytes(response.read())
 return p.read_bytes(),datetime.datetime.fromtimestamp(p.stat().st_mtime,datetime.timezone.utc).isoformat()
def dump(name,p):
 b=(json.dumps(p,ensure_ascii=False,indent=2)+'\n').encode();(D/name).write_bytes(b);return sha(b)
def capture():
 if (D/'manifest.json').exists():raise SystemExit('Snapshot already exists. Use a new version directory for a new capture.')
 manifest={}
 b,at=get(JST,'jst');doc,doc_at=get(JSTDOC,'jstdoc')
 reader=pd.io.stata.StataReader(io.BytesIO(b));labels=reader.variable_labels();df=reader.read();f=df[df.iso=='FIN'].copy()
 assert len(f)==151 and set(f.country)=={'Finland'}
 out=io.StringIO(newline='');w=csv.writer(out,lineterminator='\n');w.writerow(f.columns)
 for row in f.itertuples(index=False,name=None):w.writerow(['' if pd.isna(v) else format(float(v),'.17g') if isinstance(v,float) else str(v) for v in row])
 raw=out.getvalue().encode();(D/'jst-finland.csv').write_bytes(raw)
 manifest['jst']={'source_url':JST,'documentation_url':JSTDOC,'source_sha256':sha(b),'documentation_sha256':sha(doc),'retrieved_at':at,'documentation_retrieved_at':doc_at,'subset_sha256':sha(raw),'subset':'jst-finland.csv','subset_scope':'151 Finland rows, 1870–2020, all fields; missing stays blank; floats round-trip with 17 significant digits','release':'R6','license':'CC BY-NC-SA 4.0','variable_labels':labels,'citation':'Òscar Jordà, Moritz Schularick, Alan M. Taylor (2017). Macrofinancial History and the New Business Cycle Facts. NBER Macroeconomics Annual 2016, volume 31.','returns_citation':'Òscar Jordà, Katharina Knoll, Dmitry Kuvshinov, Moritz Schularick, Alan M. Taylor (2019). The Rate of Return on Everything, 1870–2015. Quarterly Journal of Economics 134(3), 1225–1298.','bank_ratios_citation':'Òscar Jordà, Björn Richter, Moritz Schularick, Alan M. Taylor (2021). Bank capital redux: solvency, liquidity, and crisis. Review of Economic Studies 88(1), 260–286.'}
 b,at=get(CPI,'cpi-data',Q);m,mat=get(CPI,'cpi-meta')
 (D/'cpi-response.json').write_bytes(b);(D/'cpi-metadata.json').write_bytes(m)
 manifest['cpi']={'source_url':CPI,'query':Q,'source_sha256':sha(b),'metadata_sha256':sha(m),'retrieved_at':at,'metadata_retrieved_at':mat,'subset':'cpi-response.json','subset_sha256':sha(b),'source':'Tilastokeskus, kuluttajahintaindeksi, StatFin 11xy','unit':'indeksi, 1914:1–6=100'}
 b,at=get(WOOD,'wood-xlsx')
 ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 with zipfile.ZipFile(io.BytesIO(b)) as z:
  strings=[]
  if 'xl/sharedStrings.xml' in z.namelist():
   strings=[''.join(e.itertext()) for e in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)]
  cells={}
  for c in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:c',ns):
   v=c.find('m:v',ns)
   if v is None:continue
   val=v.text
   if c.get('t')=='s':val=strings[int(val)]
   cells[c.get('r')]=val
 records=[]
 for i in range(1,200):
  y=cells.get(f'A{i}','')
  if y.isdigit() and 1850<=int(y)<=2025:records.append({'year':int(y),'domestic':cells.get(f'B{i}'),'imported':cells.get(f'C{i}'),'energy':cells.get(f'D{i}'),'sheet_row':i})
 assert len(records)==165 and records[0]['year']==1860 and records[-1]['year']==2024
 wh=dump('wood-extract.json',{'sheet':'Taul1','records':records,'unit':'miljoonaa m³','columns':{'domestic':'B: metsäteollisuuden kotimainen puu','imported':'C: metsäteollisuuden tuontipuu','energy':'D: puun käyttö energiantuotannossa'},'footnote_summary':'Energiakäyttö sisältää runkopuuhaketta sekä pientalojen polttopuuta ja metsäteollisuuden polttopuuta 1955–1988. Vuoteen 1992 saakka mukana myös muita käyttötarkoituksia; rajaus muuttuu vuonna 1993.'})
 manifest['wood']={'source_url':WOOD,'source_sha256':sha(b),'retrieved_at':at,'subset':'wood-extract.json','subset_sha256':wh,'subset_scope':'Numeric OOXML cell strings, row coordinates and years; original workbook not modified','source':'Tilastokeskus, Suomen tilastollinen vuosikirja 2025, taulukko 9.21; SVT: Luonnonvarakeskus','unit':'miljoonaa m³'}
 dump('manifest.json',manifest)
 print('Captured JST, StatFin CPI, Luke/Statistical Yearbook roundwood')
if __name__=='__main__':capture()
