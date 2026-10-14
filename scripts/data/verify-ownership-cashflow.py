"""Verify reviewed per-share dividend rows against Stora Enso's primary PDF.
Payment dates were checked visually in the same table; they are retained in JSON.
Requires pdftotext. Does not infer public receipts from year-end ownership shares.
"""
import hashlib,json,pathlib,re,subprocess,tempfile,urllib.request
root=pathlib.Path(__file__).resolve().parents[2]
path=root/'src/components/planeetta/ownership-cashflow-data.json'
data=json.loads(path.read_text())
with urllib.request.urlopen(urllib.request.Request(data['sources']['dividends'],headers={'User-Agent':'Mozilla/5.0'}),timeout=45) as response:raw=response.read()
assert hashlib.sha256(raw).hexdigest()==data['dividendSourceSha256'], 'Source changed; review payment dates before updating the snapshot.'
with tempfile.TemporaryDirectory() as directory:
 pdf=pathlib.Path(directory)/'dividends.pdf';pdf.write_bytes(raw)
 text=subprocess.check_output(['pdftotext','-layout',str(pdf),'-'],text=True)
 for year in range(2018,2025):
  match=re.search(rf'^\s*{year}\s+([0-9.]+(?:\+[0-9.]+)?)',text,re.M)
  assert match,year
  reported=sum(float(n) for n in match[1].split('+'))
  reviewed=sum(d['perShare'] for d in data['dividends'] if d['profitYear']==year)
  assert abs(reported-reviewed)<1e-9,(year,reported,reviewed)
assert all(d['date']>'2018-06-12' and int(d['date'][:4])<=2025 for d in data['dividends'])
print('Verified seven fiscal-year rows, including both 2024 payment-year instalments.')
print('Primary PDF SHA-256:',hashlib.sha256(raw).hexdigest())
