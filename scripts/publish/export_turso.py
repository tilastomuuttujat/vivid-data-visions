"""Publish a strict public subset of the immutable Turso migration archive.

No source writes, no credentials in output. Run in CI before build:site.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import time
import urllib.error
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'migration'))
from turso_pilot import Turso, stmt
from turso_indicators import arg
from turso_images import decode

SERIES_FIELDS = 'series_key title description source source_url unit geography frequency data_class'.split()
VALUE_FIELDS = 'series_key year group_key group_label period value value_text value_kind'.split()
# Captions explicitly identify the old IDs; all five original images were visually reviewed.
ALIASES = {
    'M18_kriisien_piirteet.webp': ('M02_kriisien_piirteet.webp', '8161b4d73feb551d852b33f5de7be08e452c09f821345ab122791e8e78cb6840'),
    'M17_onnistumisten_piirteet.webp': ('M01_onnistumisten_piirteet.webp', 'f2402d83073788342c6ddf3ff3435f201071c23003c5c83bf4e5ccf52b6e1b35'),
    'G08_oikeudenmukaisuus.webp': ('G01_oikeudenmukaisuus.webp', '668b45848abbddb11b473c7a288c3a61de86712530fcf53b1913dcf8432c40f0'),
    'G09_sukupolvi_kantaa.webp': ('G02_sukupolvi_kantaa.webp', 'a378931483ec4faa3707768a9ce7689e93fe45bb2bfb2ca6a6a9d2217ecb34fe'),
    'G07_tulevien_oikeudet.webp': ('G04_tulevien_oikeudet.webp', '93f42b7a368c3c13fa57239cd59195a801947243664717c1150f0310383976d7'),
}
PUBLIC_VALUES = (' FROM public__indicator_values v JOIN public__indicator_series s '
                 'ON s.series_key=v.series_key WHERE v.is_published=1 AND s.published=1')

class Archive:
    def __init__(self):
        self.db = Turso()
    def query(self, sql, params=()):
        for attempt in range(4):
            try:
                return decode(self.db.execute([stmt(sql, [arg(v) for v in params])], close=True)[0])
            except (urllib.error.URLError, TimeoutError):
                self.db.baton = None
                if attempt == 3:
                    raise
                time.sleep(2 ** attempt)


def write_json(path, data):
    encoded = json.dumps(data, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(encoded)
    return hashlib.sha256(encoded).hexdigest()


def snapshot(db):
    series = db.query('SELECT '+','.join(SERIES_FIELDS)+' FROM public__indicator_series WHERE published=1 ORDER BY series_key')
    images = db.query('SELECT id,storage_path,content_summary,purpose FROM public__infographics WHERE unpublished=0 ORDER BY id')
    count = db.query('SELECT count(*)'+PUBLIC_VALUES)[0][0]
    if not series or not images or count < 1:
        raise ValueError('Empty public archive')
    return series, images, count


def generate(db, output, page_size=5000):
    series_rows, image_rows, expected_count = snapshot(db)
    series = {r[0]: dict(zip(SERIES_FIELDS, r)) for r in series_rows}
    cursor = None
    current = None
    values = []
    count = 0
    def flush():
        if current is None:
            return
        record = series[current]
        payload = {'series_key': current, 'columns': VALUE_FIELDS[1:], 'rows': values}
        digest = write_json(output / 'series' / (hashlib.sha256(current.encode()).hexdigest()+'.json'), payload)
        record.update(file='series/'+hashlib.sha256(current.encode()).hexdigest()+'.json',
                      sha256=digest, observations=len(values),
                      first_year=min(r[0] for r in values), last_year=max(r[0] for r in values))
    while True:
        where = '' if cursor is None else ' AND (v.series_key,v.year,v.group_key)>(?,?,?)'
        page = db.query('SELECT '+','.join('v.'+f for f in VALUE_FIELDS)+PUBLIC_VALUES+where+
                        ' ORDER BY v.series_key,v.year,v.group_key LIMIT ?',
                        ([] if cursor is None else list(cursor)) + [page_size])
        for row in page:
            if row[0] not in series:
                raise ValueError('Unexpected unpublished series')
            if current != row[0]:
                flush()
                current, values = row[0], []
            # Keep precise decimal strings, nulls, text values and recorded years unchanged.
            values.append(row[1:])
            count += 1
        if not page:
            break
        next_cursor = tuple(page[-1][:3])
        if cursor is not None and next_cursor <= cursor:
            raise ValueError('Pagination did not advance')
        cursor = next_cursor
        print('Published observations:', count, flush=True)
        if len(page) < page_size:
            break
    flush()
    if count != expected_count:
        raise ValueError('Public observation count changed')
    for record in series.values():
        record.setdefault('observations', 0)
    names = sorted({ALIASES.get(r[1], (r[1], None))[0] for r in image_rows})
    assets = {}
    for start in range(0, len(names), 5):
        batch = names[start:start+5]
        rows = db.query('SELECT name,mime_type,byte_size,sha256,content FROM storage__atlas_images_v1 '
                        'WHERE bucket=? AND name IN ('+','.join('?' for _ in batch)+') ORDER BY name',
                        ['atlas-images']+batch)
        if {r[0] for r in rows} != set(batch):
            raise ValueError('Missing archived public image')
        for name, mime, size, sha, content in rows:
            if (mime != 'image/webp' or not isinstance(content, bytes) or len(content) != size or
                hashlib.sha256(content).hexdigest() != sha or content[:4] != b'RIFF' or content[8:12] != b'WEBP'):
                raise ValueError('Image verification failed')
            path = 'images/'+sha+'.webp'
            (output/'images').mkdir(exist_ok=True)
            (output/path).write_bytes(content)
            assets[name] = {'file': path, 'sha256': sha, 'bytes': size}
        print('Published images:', min(start+5, len(names)), '/', len(names), flush=True)
    images = []
    for identity, original, title, purpose in image_rows:
        effective, expected_sha = ALIASES.get(original, (original, None))
        asset = assets[effective]
        if expected_sha is not None and asset['sha256'] != expected_sha:
            raise ValueError('Reviewed image alias differs from original')
        images.append({'id': identity, 'title': title or effective, 'purpose': purpose,
                       'original_path': original, 'archive_path': effective, **asset})
    if snapshot(db) != (series_rows, image_rows, expected_count):
        raise ValueError('Publication selection changed during export; retry with archive updates paused')
    manifest = {'version': 1, 'source': 'Turso', 'observations': count,
                'series': list(series.values()), 'images': images,
                'resolved_image_paths': sum(r[1] in ALIASES for r in image_rows)}
    write_json(output/'catalog.json', manifest)
    return manifest


def publish(db, output):
    output.parent.mkdir(parents=True, exist_ok=True)
    # A failed export never replaces the previous publication.
    with tempfile.TemporaryDirectory(dir=output.parent) as temporary:
        staging = Path(temporary)/'snapshot'
        staging.mkdir()
        manifest = generate(db, staging)
        if output.exists():
            if not (output/'catalog.json').is_file():
                raise ValueError('Refusing to replace a non-publication directory')
            backup = Path(temporary)/'previous'
            output.rename(backup)
            try:
                staging.rename(output)
            except Exception:
                backup.rename(output)
                raise
        else:
            staging.rename(output)
    return manifest

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('public/data/turso'))
    args = parser.parse_args()
    try:
        result = publish(Archive(), args.output)
        print('PASS: Public Turso snapshot:', len(result['series']), 'series,', result['observations'],
              'observations,', len(result['images']), 'image records;', result['resolved_image_paths'], 'paths resolved.')
    except Exception as error:
        # HTTP exceptions can contain request information; do not print them.
        print('Publication failed ('+type(error).__name__+'); previous publication preserved.', file=sys.stderr)
        sys.exit(1)
