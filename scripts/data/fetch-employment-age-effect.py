#!/usr/bin/env python3
"""Refresh the national all-age employment decomposition input; standard library only."""
import argparse, datetime, hashlib, itertools, json, math, pathlib, urllib.request
URL = 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/tyokay/115w.px'
def decode(meta, raw, query):
    data = json.loads(raw)
    dims = data['id']; sizes = data['size']; lookup = {}
    for coords in itertools.product(*(range(n) for n in sizes)):
        offset = 0; keys = {}
        for dim, n, coordinate in zip(dims, sizes, coords):
            offset = offset * n + coordinate
            cat = data['dimension'][dim]['category']['index']
            codes = sorted(cat, key=cat.get) if isinstance(cat, dict) else cat
            keys[dim] = codes[coordinate]
        values = data['value']; value = values[offset] if isinstance(values,list) else values.get(str(offset))
        if not isinstance(value,(int,float)) or isinstance(value,bool) or not math.isfinite(value) or value<0 or int(value)!=value: raise ValueError('Missing or invalid source count')
        lookup[(keys['paaasial_toimin_3_20180101'],keys['ikaryhma_10_20180101'],int(keys['timeperiod_y']))] = value
    ages = next(v for v in meta['variables'] if v['code']=='ikaryhma_10_20180101')
    groups = [{'id':c,'label':label} for c,label in zip(ages['values'],ages['valueTexts']) if c!='SSS']
    years = sorted({k[2] for k in lookup}); rows=[]
    for year in years:
        population=[lookup[('SSS',g['id'],year)] for g in groups]
        employed=[lookup[('11',g['id'],year)] for g in groups]
        if any(p<=0 or e<0 or e>p for p,e in zip(population,employed)): raise ValueError('Invalid age cell')
        total_population=lookup[('SSS','SSS',year)]; total_employed=lookup[('11','SSS',year)]
        if sum(population)!=total_population or sum(employed)!=total_employed: raise ValueError('Age cells do not reconcile to source total')
        rows.append({'year':year,'population':population,'employed':employed,'totalPopulation':total_population,'totalEmployed':total_employed})
    return {'source':{'title':'Tilastokeskus, työssäkäynti 115w: väestö pääasiallisen toiminnan ja iän mukaan','url':URL,'retrieved':datetime.date.today().isoformat(),'updated':data.get('updated'),'sha256':hashlib.sha256(raw).hexdigest(),'query':query,'unit':'henkilöä, 31.12.','scope':'Koko maa, kaikki iät, molemmat sukupuolet'},'groups':groups,'rows':rows}
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--response',type=pathlib.Path);parser.add_argument('--metadata',type=pathlib.Path);parser.add_argument('--query',type=pathlib.Path);args=parser.parse_args()
    if args.response:
        meta=json.loads(args.metadata.read_text());query=json.loads(args.query.read_text());raw=args.response.read_bytes()
    else:
        meta=json.load(urllib.request.urlopen(URL,timeout=60));query={'query':[],'response':{'format':'json-stat2'}}
        for v in meta['variables']:
            code=v['code'];values=v['values'] if code in ['ikaryhma_10_20180101','timeperiod_y','contentscode'] else ['SSS']
            if code=='paaasial_toimin_3_20180101':values=['SSS','11']
            query['query'].append({'code':code,'selection':{'filter':'item','values':values}})
        raw=urllib.request.urlopen(urllib.request.Request(URL,data=json.dumps(query).encode(),headers={'Content-Type':'application/json'}),timeout=60).read()
    result=decode(meta,raw,query);target=pathlib.Path(__file__).resolve().parents[2]/'src/components/kokonaiskuva/employment-age-data.json'
    temp=target.with_suffix('.tmp');temp.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');temp.replace(target)
    print(f"Validated {len(result['rows'])} years; all age cells reconcile to published totals")
if __name__=='__main__':main()
