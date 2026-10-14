"""Rebuild the bundled Sotkanet snapshot; use --cache for a downloaded snapshot."""
import argparse, concurrent.futures, datetime, hashlib, json, pathlib, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[2]
IDS = [171, 5513, 5439, 5679, 6035, 6037]
parser = argparse.ArgumentParser()
parser.add_argument('--cache', type=pathlib.Path)
args = parser.parse_args()

def read(name, url):
    if args.cache:
        raw = (args.cache / name).read_bytes()
    else:
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'})
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read()
    return json.loads(raw), hashlib.sha256(raw).hexdigest()

def fetch(i):
    url = f'https://sotkanet.fi/rest/1.1/json?indicator={i}' + ''.join(f'&years={y}' for y in range(2016, 2026)) + '&genders=total'
    rows, digest = read(f'{i}.json', url)
    meta, _ = read(f'meta-{i}.json', f'https://sotkanet.fi/rest/1.1/indicators/{i}')
    return str(i), dict(url=url, sha256=digest, updated=meta['data-updated'], title=meta['title']['fi'],
        description=meta.get('description', {}).get('fi', ''), limits=meta.get('limits', {}).get('fi', ''),
        notices=meta.get('notices', {}).get('fi', ''), rows=rows)

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    indicators = dict(pool.map(fetch, IDS))
regions, _ = read('regions.json', 'https://sotkanet.fi/rest/1.1/regions')
region_ids = [658] + list(range(956, 979))
output = dict(retrieved=datetime.date.today().isoformat(), indicators=[], regions=[])
for key, item in indicators.items():
    output['indicators'].append(dict(id=int(key), **{k:v for k,v in item.items() if k != 'rows'}))
for rid in region_ids:
    region = next(r for r in regions if r['id'] == rid)
    values = {}
    for key, item in indicators.items():
        selected = [r for r in item['rows'] if r['region'] == rid and r['gender'] == 'total']
        assert len({r['year'] for r in selected}) == len(selected), (rid, key)
        for r in selected:
            if int(key) != 5439:
                assert 0 <= r['value'] <= 100
            values.setdefault(str(r['year']), {})[key] = dict(value=r['value'], count=r.get('absValue'))
    output['regions'].append(dict(id=rid, name=region['title']['fi'], values=values))
assert output['regions'][0]['values']['2024']['171']['count'] == 652831
(ROOT / 'src/components/planeetta/care-capacity-data.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
print('Saved', len(output['regions']), 'regions and', len(output['indicators']), 'indicators')
