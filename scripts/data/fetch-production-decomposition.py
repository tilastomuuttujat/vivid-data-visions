"""Fetch StatFin 15ai inputs for the impact-layer production model (1975-2025).
Matches supabase/impact-layer bindings: GDP (2015 prices), hours, domestic employed, mean population.
Standard library only; writes src/components/dekompositio/production-data.json atomically."""
import json, urllib.request, pathlib, datetime, hashlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
URL = 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ntp/15ai.px'
YEARS = [str(y) for y in range(1975, 2026)]
query = [
    {'code': 'timeperiod_y', 'selection': {'filter': 'item', 'values': YEARS}},
    {'code': 'toimiala_79_20180101', 'selection': {'filter': 'item', 'values': ['SSS']}},
    {'code': 'taloustoimi_1_20180101', 'selection': {'filter': 'item', 'values': ['B1GMH', 'E1', 'E2', 'EP']}},
    {'code': 'contentscode', 'selection': {'filter': 'item', 'values': ['ntp-R2015P', 'ntp-TP2010', 'ntp-MH2010', 'ntp-TP']}},
]
req = urllib.request.Request(URL, data=json.dumps({'query': query, 'response': {'format': 'json'}}).encode(), headers={'Content-Type': 'application/json'})
raw = urllib.request.urlopen(req, timeout=60).read()
d = json.loads(raw)
keys = [c['code'] for c in d['columns'] if c['type'] != 'c']
cols = [c['code'] for c in d['columns'] if c['type'] == 'c']
want = {('B1GMH', 'ntp-R2015P'): 'gdp', ('E2', 'ntp-MH2010'): 'hours', ('E1', 'ntp-TP2010'): 'employed', ('EP', 'ntp-TP'): 'population'}
rows = {}
for e in d['data']:
    k = dict(zip(keys, e['key']))
    for c, v in zip(cols, e['values']):
        name = want.get((k['taloustoimi_1_20180101'], c))
        if name and v not in ('.', '..', '...', ''):
            rows.setdefault(int(k['timeperiod_y']), {})[name] = float(v)
points = [dict(year=y, **r) for y, r in sorted(rows.items()) if len(r) == 4 and all(x > 0 for x in r.values())]
if not points or points[0]['year'] != 1975:
    raise SystemExit('1975 baseline missing; refusing to write')
out = {'retrieved': datetime.date.today().isoformat(), 'source': {'title': 'Tilastokeskus 15ai, kansantalouden tilinpito', 'url': URL, 'query': query, 'sha256': hashlib.sha256(raw).hexdigest()},
       'units': {'gdp': 'milj. euroa, viitevuoden 2015 hinnoin', 'hours': 'milj. tuntia', 'employed': '1000 henkeä, kotimaa', 'population': '1000 henkeä, keskiväkiluku'}, 'points': points}
target = ROOT / 'src/components/dekompositio/production-data.json'
target.parent.mkdir(parents=True, exist_ok=True)
tmp = target.with_suffix('.tmp'); tmp.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n'); tmp.replace(target)
print(len(points), points[0], points[-1])
