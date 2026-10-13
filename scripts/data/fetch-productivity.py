"""Refresh the fixed 1980–2024 StatFin snapshot; Python standard library only."""
import json, urllib.request, datetime, pathlib
YEARS = [str(y) for y in range(1980, 2025)]
SPECS = [('ttut','14w1',['ind2015']),('ttut','14w6',['Tyopanos_korv','ARVL_CP','Poma_korv']),('ati','14uu',['ati_1964_100']),('khi','11xm',['khi-pisteluku'])]
raw = {}
for dataset, table, measures in SPECS:
    url = f'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/{dataset}/{table}.px'
    query = [{'code':'timeperiod_y','selection':{'filter':'item','values':YEARS}}, {'code':'contentscode','selection':{'filter':'item','values':measures}}]
    if dataset == 'ttut': query.append({'code':'toimiala_79_20180101','selection':{'filter':'item','values':['SSS']}})
    request = urllib.request.Request(url, data=json.dumps({'query':query,'response':{'format':'json'}}).encode(), headers={'Content-Type':'application/json'})
    response = json.loads(urllib.request.urlopen(request, timeout=45).read())
    raw[table] = {'url':url,'query':query,'response':response}
    print(table, response['data'][:1], flush=True)
rows = {}
for table, payload in raw.items():
    codes = [c['code'] for c in payload['response']['columns'] if c['type'] != 'c']
    for entry in payload['response']['data']:
        key = dict(zip(codes, entry['key']))
        year = int(key['timeperiod_y'])
        # JSON response places measure codes in column definitions (type c).
        measures = [c['code'] for c in payload['response']['columns'] if c['type'] == 'c']
        rows.setdefault(year, {}).update(dict(zip(measures, map(float, entry['values']))))
base = rows[1980]
series = []
for year, row in sorted(rows.items()):
    series.append(dict(year=year, productivity=row['ind2015']/base['ind2015']*100, realEarnings=(row['ati_1964_100']/row['khi-pisteluku'])/(base['ati_1964_100']/base['khi-pisteluku'])*100, labourShare=row['Tyopanos_korv']/row['ARVL_CP']*100))
root = pathlib.Path(__file__).resolve().parents[2]
(root/'src/components/planeetta/productivity-data.json').write_text(json.dumps({'retrieved':datetime.date.today().isoformat(),'series':series,'sources':raw}, ensure_ascii=False, indent=2)+'\n')
