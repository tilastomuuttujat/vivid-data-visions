import hashlib
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from export_turso import SERIES_FIELDS, VALUE_FIELDS, ALIASES, publish

class Database:
    def __init__(self):
        self.db = sqlite3.connect(':memory:')
        self.db.execute('CREATE TABLE public__indicator_series ('+','.join(SERIES_FIELDS)+',published INTEGER)')
        self.db.execute('CREATE TABLE public__indicator_values ('+','.join(VALUE_FIELDS)+',is_published INTEGER)')
        self.db.execute('CREATE TABLE public__infographics (id,storage_path,content_summary,purpose,unpublished)')
        self.db.execute('CREATE TABLE storage__atlas_images_v1 (bucket,name,mime_type,byte_size,sha256,content BLOB)')
        for key, published in [('public', 1), ('private', 0), ('empty', 1)]:
            self.db.execute('INSERT INTO public__indicator_series VALUES ('+','.join('?' for _ in range(10))+')',
                            [key, key, None, 'source', None, 'units', 'Finland', 'annual', 'observed', published])
        for row in [('public', 1990, 'a', None, None, '0', None, 'observed', 1),
                    ('public', 2000, 'a', None, None, None, 'n/a', 'estimate', 1),
                    ('public', 2001, 'b', 'Group B', None, '123456789.123456789', None, 'observed', 1),
                    ('public', 1850, 'a', None, None, 'SECRET', None, 'observed', 0),
                    ('private', 2000, 'a', None, None, 'SECRET', None, 'observed', 1)]:
            self.db.execute('INSERT INTO public__indicator_values VALUES (?,?,?,?,?,?,?,?,?)', row)
        self.db.execute("INSERT INTO public__infographics VALUES (1,'public.webp','Public image','chart',0)")
        self.db.execute("INSERT INTO public__infographics VALUES (2,'SECRET.webp','SECRET','SECRET',1)")
        content = b'RIFF\x04\x00\x00\x00WEBP'
        self.db.execute('INSERT INTO storage__atlas_images_v1 VALUES (?,?,?,?,?,?)',
                        ('atlas-images', 'public.webp', 'image/webp', len(content), hashlib.sha256(content).hexdigest(), content))
    def query(self, sql, params=()):
        return [list(r) for r in self.db.execute(sql, params)]

class PublicationTests(unittest.TestCase):
    def test_publication_filters_private_rows_and_preserves_gaps_nulls_and_precision(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary)/'snapshot'
            from export_turso import generate
            output.mkdir()
            manifest = generate(Database(), output, page_size=1)
            self.assertEqual(manifest['observations'], 3)
            self.assertEqual(len(manifest['images']), 1)
            series = next(s for s in manifest['series'] if s['series_key'] == 'public')
            values = json.loads((output/series['file']).read_text())['rows']
            self.assertEqual([r[0] for r in values], [1990, 2000, 2001])
            self.assertEqual(values[0][4], '0')
            self.assertIsNone(values[1][4])
            self.assertEqual(values[2][4], '123456789.123456789')
            for file in output.rglob('*.json'):
                self.assertNotIn('SECRET', file.read_text())
    def test_failure_preserves_previous_publication(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary)/'snapshot'
            publish(Database(), output)
            original = (output/'catalog.json').read_bytes()
            db = Database()
            db.db.execute("UPDATE storage__atlas_images_v1 SET sha256='corrupted'")
            with self.assertRaisesRegex(ValueError, 'verification'):
                publish(db, output)
            self.assertEqual((output/'catalog.json').read_bytes(), original)
    def test_reviewed_alias_requires_exact_image_digest(self):
        db = Database()
        missing, (existing, _) = next(iter(ALIASES.items()))
        db.db.execute('UPDATE public__infographics SET storage_path=? WHERE id=1', (missing,))
        db.db.execute('UPDATE storage__atlas_images_v1 SET name=?', (existing,))
        with tempfile.TemporaryDirectory() as temporary:
            with self.assertRaisesRegex(ValueError, 'alias differs'):
                publish(db, Path(temporary)/'snapshot')

if __name__ == '__main__':
    unittest.main()
