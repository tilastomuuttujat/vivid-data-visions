"""Rebuild the municipal snapshot and screening correlations from pinned PxWeb responses.

python -m pip install -r scripts/data/municipal-requirements.txt
python scripts/data/build-municipal-correlations.py [--refresh]
--refresh repeats the exact saved queries; inspect source/dimension changes before committing.
"""
import argparse
import datetime
import itertools
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / 'scripts/data/municipal-sources'
# id, label, unit, group, source, source code, optional denominator and multiplier
SPECS = [
 ('population','Väkiluku','asukasta','Tausta','keys','M411'),
 ('urban','Taajama-aste','%','Tausta','keys','M408'),
 ('children','Alle 15-vuotiaat','%','Väestö','keys','M391'),
 ('older','Yli 64-vuotiaat','%','Väestö','keys','M478'),
 ('growth','Väkiluvun vuosimuutos','%','Väestö','keys','M476'),
 ('natural','Luonnollinen väestönlisäys','/ 1 000 as.','Väestö','keys','M303','M411',1000),
 ('migration','Kuntien välinen nettomuutto','/ 1 000 as.','Väestö','keys','M297','M411',1000),
 ('secondary','Vähintään toisen asteen tutkinto','% (15+ v.)','Osaaminen','keys','M488'),
 ('higher','Korkea-asteen tutkinto','% (15+ v.)','Osaaminen','keys','M486'),
 ('employment','Työllisyysaste, 20–64-vuotiaat','%','Työ','keys','M536'),
 ('unemployment','Työttömien osuus työvoimasta','%','Työ','keys','M162'),
 ('dependency','Taloudellinen huoltosuhde','/ 100 työllistä','Työ','keys','M485'),
 ('jobs','Työpaikkaomavaraisuus','%','Työ','keys','M151'),
 ('localwork','Omassa kunnassa työssäkäyvät','% työllisistä','Työ','keys','M130'),
 ('primary','Alkutuotannon työpaikat','%','Elinkeinot','keys','M72'),
 ('industry','Jalostuksen työpaikat','%','Elinkeinot','keys','M84'),
 ('services','Palvelujen työpaikat','%','Elinkeinot','keys','M106'),
 ('rental','Vuokra-asunnoissa asuvat asuntokunnat','%','Asuminen','keys','M70'),
 ('income','Käytettävissä oleva mediaanitulo','€/kulutusyksikkö','Toimeentulo','income','tjt-ekvikturaha_med'),
 ('poverty','Pienituloisuusaste','%','Toimeentulo','income','rpt_aste'),
 ('gini','Gini-kerroin, käytettävissä olevat rahatulot','Gini (0–100)','Toimeentulo','income','gini_kturaha'),
 ('benefits','Kokonaan perusturvan varassa','% asuntoväestöstä','Toimeentulo','income','pt1_henkiloita','tjt-henkiloita',100),
 ('crowded','Ahtaasti asuvat asuntokunnat','%','Asuminen','housing','aht_asku','asku-Lkm',100),
 ('crowded_children','Ahtaasti asuvat lapsiasuntokunnat','% lapsiasuntokunnista','Asuminen','housing','aht_lapasku','lapasku',100),
 ('voting','Kuntavaalien äänestysaktiivisuus 2025','%','Osallistuminen','voting','kvaa-aan_pros'),
]

def decode(response):
    """JSON-stat2: last dimension varies fastest; preserve null/suppressed values."""
    dimensions = response['id']
    levels = []
    for dim in dimensions:
        index = response['dimension'][dim]['category']['index']
        levels.append(index if isinstance(index, list) else sorted(index, key=index.get))
    result = {}
    values = response['value']
    for i, combo in enumerate(itertools.product(*levels)):
        v = values[i] if isinstance(values, list) else values.get(str(i))
        result[combo] = float(v) if v is not None and math.isfinite(float(v)) else None
    return dimensions, result


def fdr(pvalues, arbitrary=False):
    """BH or BY adjustment over the entire finite pair family, before display filtering."""
    n = len(pvalues)
    factor = sum(1 / i for i in range(1, n + 1)) if arbitrary else 1
    out = [None] * n
    previous = 1.0
    for rank, index in reversed(list(enumerate(sorted(range(n), key=pvalues.__getitem__), 1))):
        previous = min(previous, pvalues[index] * n * factor / rank)
        out[index] = previous
    return out


def statistic(x, y, controls, method):
    import numpy as np
    from scipy.stats import rankdata, pearsonr, t
    x, y = np.asarray(x), np.asarray(y)
    z = np.asarray(controls)
    if len(x) < 30 or np.ptp(x) == 0 or np.ptp(y) == 0:
        return None
    if method == 'spearman':
        x, y = rankdata(x), rankdata(y)
        if z.size:
            z = np.column_stack([rankdata(z[:, i]) for i in range(z.shape[1])])
    k = 0
    if z.size:
        design = np.column_stack([np.ones(len(x)), z])
        k = int(np.linalg.matrix_rank(design)) - 1
        x = x - design @ np.linalg.lstsq(design, x, rcond=None)[0]
        y = y - design @ np.linalg.lstsq(design, y, rcond=None)[0]
        if np.std(x) < 1e-10 or np.std(y) < 1e-10:
            return None
    r = float(pearsonr(x, y).statistic)
    df = len(x) - k - 2
    p = 0.0 if abs(r) >= 1 else float(2 * t.sf(abs(r) * math.sqrt(df / (1 - r*r)), df))
    return dict(r=round(r, 6), p=p, n=len(x), controls=k)


def structural(a, b):
    reasons = []
    if {a, b} <= {'primary', 'industry', 'services'}:
        reasons.append('Saman toimialakokonaisuuden osuuksia: summa rajoittaa yhteyttä.')
    if {a, b} == {'secondary', 'higher'}:
        reasons.append('Sisäkkäiset koulutusosuudet: korkea-aste sisältyy vähintään toiseen asteeseen.')
    if {a, b} <= {'employment', 'unemployment', 'dependency'}:
        reasons.append('Työllisyyteen sidoksissa olevia määritelmiä ja osin yhteisiä nimittäjiä.')
    if {a, b} == {'crowded', 'crowded_children'}:
        reasons.append('Lapsiasuntokunnat sisältyvät kaikkiin asuntokuntiin.')
    return ' '.join(reasons) or None


def build(refresh=False):
    records = {p.stem: json.loads(p.read_text()) for p in sorted(SOURCES.glob('*.json'))}
    if refresh:
        import urllib.request
        for name, rec in records.items():
            request = urllib.request.Request(rec['url'], data=json.dumps(rec['query']).encode(), headers={'Content-Type':'application/json'})
            rec['metadata'] = json.load(urllib.request.urlopen(rec['url'], timeout=90))
            rec['response'] = json.load(urllib.request.urlopen(request, timeout=90))
            rec['retrieved'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            (SOURCES / (name+'.json')).write_text(json.dumps(rec, ensure_ascii=False, separators=(',', ':'))+'\n')
    decoded = {k:decode(v['response']) for k,v in records.items()}
    def value(source, area, year, measure):
        dims, vals = decoded[source]
        coords = []
        for dim in dims:
            text = next(v['text'] for v in records[source]['metadata']['variables'] if v['code']==dim)
            coords.append(area if text in ['Alue','Maakunta ja kunta'] else str(year) if text=='Vuosi' else measure if text=='Tiedot' else 'SSS')
        return vals.get(tuple(coords))
    area = records['keys']['metadata']['variables'][0]
    municipalities = [dict(id=id, name=name) for id,name in zip(area['values'],area['valueTexts']) if id.startswith('KU')]
    # Refuse silent boundary mismatch when municipality codes or names change.
    canonical = {a['id']:a['name'] for a in municipalities}
    for source in ['income','housing']:
        v = next(v for v in records[source]['metadata']['variables'] if v['text']=='Alue')
        names = {id:name for id,name in zip(v['values'],v['valueTexts']) if id.startswith('KU')}
        if names != canonical:
            raise ValueError(f'{source}: municipal geography mismatch; harmonize boundaries explicitly')
    indicators = []
    for id,label,unit,group,source,code,*ratio in SPECS:
        meta = next(v for v in records[source]['metadata']['variables'] if v['text']=='Tiedot')
        source_label = dict(zip(meta['values'],meta['valueTexts']))[code]
        indicators.append(dict(id=id,label=label,unit=unit,group=group,source=source,code=code,sourceLabel=source_label,
            formula=f'{code} / {ratio[0]} × {ratio[1]}' if ratio else None,
            note='Nimittäjänä saman vuoden lopun väkiluku.' if id in ['natural','migration'] else None,
            fixedYear=2025 if source=='voting' else None))
    snapshots=[]
    for year in [2023,2024]:
        rows=[]
        for a in municipalities:
            values=[]
            for id,label,unit,group,source,code,*ratio in SPECS:
                y=2025 if source=='voting' else year
                v=value(source,a['id'],y,code)
                if ratio:
                    denom=value(source,a['id'],y,ratio[0])
                    v=v / denom * ratio[1] if v is not None and denom is not None and denom > 0 else None
                values.append(round(v,6) if v is not None else None)
            rows.append(dict(**a,values=values))
        families=[]
        for mixed in [False,True]:
            for method in ['spearman','pearson']:
                for adjusted in [False,True]:
                    indices=list(range(25 if mixed else 24))
                    if adjusted:
                        indices=[i for i in indices if SPECS[i][0] not in ['population','older','urban']]
                    pairs=[]
                    for ai,bi in itertools.combinations(indices,2):
                        eligible=[row['values'] for row in rows if all(row['values'][i] is not None for i in ([ai,bi,0,3,1] if adjusted else [ai,bi]))]
                        x=[r[ai] for r in eligible]; y=[r[bi] for r in eligible]
                        controls=[[math.log(r[0]),r[3],r[1]] for r in eligible] if adjusted else []
                        stat=statistic(x,y,controls,method)
                        if stat:
                            pairs.append(dict(a=ai,b=bi,**stat,structural=structural(SPECS[ai][0],SPECS[bi][0])))
                    bh=fdr([p['p'] for p in pairs]);by=fdr([p['p'] for p in pairs],True)
                    for i,p in enumerate(pairs):p.update(qBH=bh[i],qBY=by[i])
                    families.append(dict(method=method,adjusted=adjusted,mixed=mixed,tests=len(pairs),pairs=pairs))
        snapshots.append(dict(year=year,rows=rows,families=families,coverage=[sum(r['values'][i] is not None for r in rows) for i in range(25)]))
    out=dict(schemaVersion=1,retrieved=max(v.get('retrieved','2026-10-17')[:10] for v in records.values()),geography='Kuntatunnukset ja nimet samat 2025/2026 lähteissä; 308 kuntaa. Vaalit: Manner-Suomi, 292 kuntaa.',
        method='Kunnat yhtä suurin painoin; parikohtaiset täydelliset havainnot; vähintään 30 kuntaa. Kaksisuuntainen t-approksimaatio; vakioinnissa residuaalikorrelaatio ja vapausastekorjaus. Spearmanissa myös kontrollit järjestysluvuiksi. BY/BH erikseen koko vuoden, menetelmän, vakioinnin ja vuosiyhdistelmän testiperheelle ennen käyttöliittymän suodatusta. Spatiaalista riippuvuutta ei ole korjattu; q-arvot ovat seulontaa varten. Koko kuntajoukon kuvailu, ei satunnaisotos Suomen kunnista.',
        indicators=indicators,sources=[dict(id=k,url=v['url'],label=v['metadata']['title'],updated=v['response'].get('updated'),retrieved=v.get('retrieved','2026-10-17'),query=v['query'],dimensions=v['response']['id']) for k,v in records.items()],snapshots=snapshots)
    target=ROOT/'src/components/kunnat/municipal-data.json'
    target.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n')
    print(f'{len(municipalities)} municipalities, {len(indicators)} indicators, {len(snapshots)} snapshots → {target}')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--refresh',action='store_true');build(parser.parse_args().refresh)
