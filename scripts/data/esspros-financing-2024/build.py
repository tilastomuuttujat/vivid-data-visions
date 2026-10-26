#!/usr/bin/env python3
"""Extract total-row financing series from the supplied THL workbook."""
import hashlib, json, re, sys
from pathlib import Path
import xlrd

ROOT = Path(__file__).resolve().parent
EXPECTED = '9407ee09cbe4cee342bbe1b45f5427106f9ebadd39e63beb6b70c31c95dd2fcb'
DEFS = [('valtio','Valtio',3),('kunnat','Kunnat',4),('tyonantajat','Työnantajat',5),('vakuutetut','Vakuutetut',6),('paaomatulot','Pääomatulot',7),('yhteensa','Rahoitus yhteensä',8),('rahastosiirto','Siirto rahastoihin tai rahastoista',9),('asiakasmaksut','Asiakasmaksut',10)]

def numeric(cell):
    if isinstance(cell, (int,float)): return cell, False
    text=str(cell).strip()
    if re.fullmatch(r'-?[0-9 ][0-9 ]*\*',text): return int(text[:-1].replace(' ','')), True
    raise ValueError(f'Unknown value {text!r}')

def build(path):
    raw=Path(path).read_bytes()
    assert hashlib.sha256(raw).hexdigest()==EXPECTED, 'Unexpected workbook version'
    book=xlrd.open_workbook(file_contents=raw)
    assert set(book.sheet_names())=={str(y) for y in range(1980,2025)}
    rows=[]; discrepancies=[]
    for year in range(1980,2025):
        s=book.sheet_by_name(str(year))
        hits=[i for i in range(s.nrows) if re.fullmatch(r'YHTEENSÄ(?:\*|1)?',str(s.cell_value(i,1)).strip().upper())]
        assert len(hits)==1,(year,hits)
        i=hits[0]; cells=s.row_values(i)
        vals={key:numeric(cells[col]) for key,_,col in DEFS}
        expense=float(cells[2]); total=vals['yhteensa'][0]; transfer=vals['rahastosiirto'][0]
        # In 2017 the state, financing total and transfer are separately rounded in the source.
        parts_residual=sum(vals[k][0] for k in ('valtio','kunnat','tyonantajat','vakuutetut','paaomatulot'))-total
        balance_residual=total-expense-transfer
        if abs(parts_residual)>.01 or abs(balance_residual)>.01:
            discrepancies.append({'year':year,'components_minus_total_million':parts_residual,'total_minus_expense_minus_transfer_million':balance_residual})
        assert abs(parts_residual)<2 and abs(balance_residual)<2,year
        for key,_,col in DEFS:
            v,rounded=vals[key]
            rows.append({'key':key,'year':year,'value':v,'source_cell':xlrd.cellname(i,col),'source_raw':cells[col], 'source_rounded':rounded,'source_label':str(cells[1]),'period_note': '2017: korjattu palkattomien aikojen eläkerahoitus 13.6.2019; tähdellä merkityt arvot pyöristetty lähteessä.' if year==2017 else ('Hyvinvointialueuudistuksen vuoksi valtion ja kuntien luokkien aikasarjassa on rakenteellinen muutos.' if year>=2023 else None)})
    assert len(rows)==360
    assert {d['year'] for d in discrepancies}=={2014,2017,2019}
    return {'batch_id':'thl_esspros_financing_1980_2024_20261026_v1','source_sha256':EXPECTED,'source_url':'https://thl.fi/data-ja-tilastot/sote-talous/sosiaaliturvan-menot-ja-rahoitus','definitions':[{'key':k,'title':t,'column':c+1} for k,t,c in DEFS],'source_discrepancies':discrepancies,'rows':rows}

if __name__=='__main__':
    data=build(sys.argv[1]); (ROOT/'batch.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n'); print('Verified workbook; extracted',len(data['rows']),'cells')
