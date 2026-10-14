"""Refresh the fixed 2010–2025 fertility window from Statistics Finland 12dt."""
import datetime
import json
from pathlib import Path
import urllib.request

API = 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/synt/12dt.px'
YEARS = list(range(2010, 2026))
QUERY = {'query': [
    {'code': 'timeperiod_y', 'selection': {'filter': 'item', 'values': [str(y) for y in YEARS]}},
    {'code': 'contentscode', 'selection': {'filter': 'item', 'values': ['tfr']}},
], 'response': {'format': 'json-stat2'}}
request = urllib.request.Request(API, data=json.dumps(QUERY).encode(), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(request, timeout=30) as response:
    result = json.load(response)
if result['id'] != ['timeperiod_y', 'contentscode'] or result['size'] != [len(YEARS), 1]:
    raise ValueError('Unexpected dimension order or size; inspect before updating the snapshot')
values = result['value']
if not isinstance(values, list) or len(values) != len(YEARS) or not all(isinstance(v, (int, float)) and 0 < v < 10 for v in values):
    raise ValueError('Missing or unexpected fertility observations')
labels = result['dimension']['timeperiod_y']['category']['index']
if isinstance(labels, list):
    observed_years = labels
else:
    observed_years = [key for key, _ in sorted(labels.items(), key=lambda item: item[1])]
if observed_years != [str(y) for y in YEARS]:
    raise ValueError('Unexpected year ordering')
data = {
    'source': 'https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__synt/12dt.px/',
    'api': API, 'retrieved': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
    'unit': 'Kokonaishedelmällisyysluku',
    'points': [{'year': year, 'tfr': value} for year, value in zip(YEARS, values)],
}
target = Path(__file__).resolve().parents[2] / 'src/components/planeetta/fertility-data.json'
target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print(f'Updated {len(YEARS)} annual observations')
