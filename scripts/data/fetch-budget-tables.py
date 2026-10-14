"""Fetch VM's historical main-title tables; unlike moment CSVs these retain totals.
Uses only the Python standard library. Caches source HTML in /tmp/budget-data.
Inspect the exported table headers before changing the extraction rules.
"""
from html.parser import HTMLParser
import concurrent.futures, csv, datetime, hashlib, io, json, pathlib, re, urllib.request, urllib.parse

CACHE=pathlib.Path('/tmp/budget-data'); CACHE.mkdir(exist_ok=True)
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.tables=[]; self.table=None; self.row=None; self.cell=None; self.links=[]; self.link=None; self.text=[]
    def handle_starttag(self,tag,attrs):
        if tag=='table': self.table=[]
        if tag=='tr': self.row=[]
        if tag in ('td','th'): self.cell=''
        if tag=='a': self.link=[dict(attrs).get('href',''),'']
    def handle_data(self,data):
        self.text.append(data)
        if self.cell is not None:self.cell+=data
        if self.link is not None:self.link[1]+=data
    def handle_endtag(self,tag):
        if tag in ('td','th') and self.cell is not None and self.row is not None:
            self.row.append(' '.join(self.cell.split())); self.cell=None
        if tag=='tr' and self.row is not None and self.table is not None:
            self.table.append(self.row); self.row=None
        if tag=='table' and self.table is not None:self.tables.append(self.table);self.table=None
        if tag=='a' and self.link is not None:self.links.append(self.link);self.link=None

def page(url):
    url=re.sub(r';jsessionid=[^?]*','',url)
    path=CACHE/(hashlib.sha256(url.encode()).hexdigest()+'.html')
    if not path.exists():
        for attempt in range(3):
            try:
                with urllib.request.urlopen(url,timeout=40) as r: path.write_bytes(r.read())
                break
            except Exception:
                if attempt==2:raise
    raw=path.read_bytes()
    try: text=raw.decode('utf-8')
    except UnicodeDecodeError:text=raw.decode('latin1')
    p=Page();p.feed(text);return p

def fetch(year):
    front=f'https://budjetti.vm.fi/indox/tae/{year}/'+('he2_2004.jsp' if year==2004 else f'he_TAE_{year}.jsp' if year<=2012 else f'hallituksenEsitys_tae_{year}.jsp')
    p=page(front)
    general=next(urllib.parse.urljoin(front,u) for u,t in p.links if t.strip()=='Yleisperustelut')
    g=page(general)
    results={}
    for kind,term in [('expense','määrärahat'),('income','tuloarviot')]:
        candidates=[(u,t) for u,t in g.links if term in t.lower()]
        if not candidates:results[kind]={'error':'No summary link','links':g.links};continue
        url=urllib.parse.urljoin(general,candidates[0][0]);q=page(url)
        results[kind]={'url':url,'tables':q.tables}
    print(year,[(k,len(v.get('tables',[]))) for k,v in results.items()],flush=True)
    out={'year':year,'front':front,'signature':' '.join(p.text)[-1700:],'sections':results}
    (CACHE/f'tables-{year}.json').write_text(json.dumps(out,ensure_ascii=False))
    return out

def build(results):
    points=[]
    def clean(url):return re.sub(r';jsessionid=[^?]*','',url)
    def number(value):
        value=value.replace(' ','').replace('\u00a0','').replace('−','-').replace(',','.')
        return float(value) if re.fullmatch(r'-?\d+(\.\d+)?',value) else None
    for document in results:
        year=document['year']
        sections=document['sections']
        tables={k:next(t for t in v['tables'] if any(r and r[0]==('29.' if k=='expense' else '11.') for r in t)) for k,v in sections.items()}
        for stage,column,target_year in [('actual',2,year-2),('proposal',4,year)]:
            if target_year>2025:continue
            for kind,table in tables.items():
                header=' '.join(' '.join(r) for r in table[:3])
                assert str(year-2) in header and 'tilinpäätös' in header and str(year) in header,(year,kind,header)
            expense={r[0].rstrip('.'):number(r[column]) for r in tables['expense'] if len(r)>column and re.fullmatch(r'\d{2}\.',r[0])}
            income={r[0].rstrip('.'):number(r[column]) for r in tables['income'] if len(r)>column and re.fullmatch(r'\d{2}\.',r[0])}
            income['borrowing']=next((number(r[column]) for r in tables['income'] if len(r)>column and r[0]=='15.03.01'),None)
            totals=[number(r[column]) for r in tables['expense'] if len(r)>column and ('yhteensä' in r[1].lower())]
            assert totals and totals[-1] is not None,(year,stage)
            original_total=totals[-1]
            assert abs(sum(v or 0 for v in expense.values())-original_total)<=len(expense), (year,stage,expense,original_total)
            expense_total=original_total-(expense.get('37') or 0)
            assert all(income.get(k) is not None for k in ['11','12','13']),(year,stage,income)
            points.append({'year':target_year,'stage':stage,'expense':expense,'income':income,
                'expenseTotal':expense_total,'expenseOriginalTotal':original_total,
                'incomeTotal':sum(income[k] for k in ['11','12','13']),
                'expenseSource':clean(sections['expense']['url']),'incomeSource':clean(sections['income']['url'])})
    assert len(points)==49,len(points)
    assert len({(p['year'],p['stage']) for p in points})==49
    # Detailed taxes are published only when all source moments reconcile with
    # the independent main-title total. Discontinued historical moments can be
    # absent in a later proposal's CSV, so failed reconciliation stays null.
    detail_keys=['directTaxes','turnoverExcise','otherTaxes']
    for p in points:
        for key in detail_keys:p['income'][key]=None
        p['incomeDetailSource']=None
        p['incomeDetailVerified']=False
    def enrich(job):
        year=job
        url=f'https://budjetti.vm.fi/indox/opendata/{year}/tae/hallituksenEsitys/{year}-tae-hallituksenEsitys-11.csv'
        path=CACHE/f'{year}-11.csv'
        if not path.exists():
            with urllib.request.urlopen(url,timeout=40) as r:path.write_bytes(r.read())
        raw=path.read_bytes()
        try:text=raw.decode('utf-8-sig')
        except UnicodeDecodeError:text=raw.decode('latin1')
        rows=list(csv.reader(io.StringIO(text),delimiter=';'));header=rows[0]
        for stage,target_year,column in [('actual',year-2,f'Toteutuma {year-2}'),('proposal',year,'Määräraha')]:
            p=next((p for p in points if p['year']==target_year and p['stage']==stage),None)
            if not p:continue
            i=header.index(column)
            total=sum(number(r[i]) or 0 for r in rows[1:] if r)/1e6
            p['incomeDetailSource']=url
            if abs(total-p['income']['11'])>.51:continue
            groups={key:0 for key in detail_keys}
            for row in rows[1:]:
                if not row:continue
                chapter=row[2].zfill(2)
                key='directTaxes' if chapter=='01' else 'turnoverExcise' if chapter in ['04','08'] else 'otherTaxes'
                groups[key]+=(number(row[i]) or 0)/1e6
            p['income'].update(groups);p['incomeDetailVerified']=True
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(enrich,range(2014,2027)))
    url='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/khi/11xm.px'
    years=list(map(str,range(2000,2026)))
    query={'query':[{'code':'timeperiod_y','selection':{'filter':'item','values':years}},
        {'code':'contentscode','selection':{'filter':'item','values':['khi-pisteluku']}}],'response':{'format':'json-stat2'}}
    with urllib.request.urlopen(urllib.request.Request(url,data=json.dumps(query).encode(),headers={'Content-Type':'application/json'}),timeout=40) as r:prices=json.load(r)
    assert prices['size']==[26,1] and all(isinstance(v,(int,float)) and v>0 for v in prices['value'])
    output={'retrieved':datetime.date.today().isoformat(),'publisher':'Valtiovarainministeriö','unit':'miljoonaa euroa, lähteen erikseen pyöristetyt luvut',
        'priceSource':url,'priceQuery':query,'prices':dict(zip(years,prices['value'])),
        'points':sorted(points,key=lambda p:(p['year'],p['stage']))}
    target=pathlib.Path('src/components/planeetta/budget-data.json')
    target.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    print('Saved',target,len(points),'points',flush=True)

if __name__=='__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        results=list(pool.map(fetch,range(2002,2027)))
    (CACHE/'tables-all.json').write_text(json.dumps(results,ensure_ascii=False))
    build(results)
