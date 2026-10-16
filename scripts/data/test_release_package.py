import json
from pathlib import Path
import runpy
import tempfile
import unittest
import zipfile

package = runpy.run_path(str(Path(__file__).parents[1] / 'package-site.py'))['package']


class ReleasePackageTests(unittest.TestCase):
    def test_packages_both_modes_with_matching_data_and_instructions(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = root / 'src/data'
            data.mkdir(parents=True)
            for name in ('atlas.json', 'anchors.json', 'maakunnat.json'):
                (data / name).write_text(json.dumps({'current': name}))
            build = root / 'build'
            build.mkdir()
            (build / 'index.html').write_text('<html><head></head><body>current-app</body></html>')
            original_root = package.__globals__['ROOT']
            try:
                package.__globals__['ROOT'] = root
                package(build, root / 'site')
            finally:
                package.__globals__['ROOT'] = original_root
            for mode in ('2d', '3d'):
                with zipfile.ZipFile(root / f'site/downloads/atlas-{mode}.zip') as archive:
                    self.assertIn(f'__ATLAS_INITIAL_MODE__="{mode}"', archive.read('index.html').decode())
                    self.assertIn('LUEMINUT.txt', archive.namelist())
                    for name in ('atlas.json', 'anchors.json', 'maakunnat.json'):
                        self.assertEqual(archive.read(f'data/{name}'), (data / name).read_bytes())
            self.assertTrue((root / 'site/downloads/minka-varaan-suomi.zip').exists())
            self.assertTrue((root / 'site/.nojekyll').exists())


if __name__ == '__main__':
    unittest.main()
