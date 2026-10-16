"""Package one standalone build into a Pages site and consistent offline downloads."""
import argparse
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DATA_FILES = ('atlas.json', 'anchors.json', 'maakunnat.json')
README = '''MINKÄ VARAAN SUOMI RAKENTUU?

Pura ZIP kokonaan. Avaa index.html selaimessa.
Jos selain estää paikallisten tiedostojen lukemisen, valitse pyydettäessä
kaikki kolme data-kansion JSON-tiedostoa. Voit myös käynnistää palvelimen:
python3 -m http.server 8000
ja avata http://localhost:8000/.

Verkkokirjasimet tarvitsevat verkkoyhteyden; sisältö ja analyysit ovat paketissa.
Ylläpitoeditorin julkaisu tarvitsee verkkoyhteyden ja GitHub-kirjoitusoikeuden.
'''


def package(build, output, downloads_only=False):
    html = (build / 'index.html').read_text()
    downloads = output if downloads_only else output / 'downloads'
    downloads.mkdir(parents=True, exist_ok=True)
    (downloads / 'data').mkdir(exist_ok=True)
    for name in DATA_FILES:
        shutil.copyfile(ROOT / 'src/data' / name, downloads / 'data' / name)
    for mode in ('2d', '3d'):
        variant = html.replace('<head>', f'<head><script>window.__ATLAS_INITIAL_MODE__="{mode}";</script>', 1)
        if variant == html:
            raise ValueError('Missing standalone HTML head')
        (downloads / f'atlas-{mode}.html').write_text(variant)
        with zipfile.ZipFile(downloads / f'atlas-{mode}.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
            archive.writestr('index.html', variant)
            archive.writestr('LUEMINUT.txt', README)
            for name in DATA_FILES:
                archive.write(ROOT / 'src/data' / name, f'data/{name}')
    with zipfile.ZipFile(downloads / 'minka-varaan-suomi.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('index.html', html)
        archive.writestr('LUEMINUT.txt', README)
        for name in DATA_FILES:
            archive.write(ROOT / 'src/data' / name, f'data/{name}')
    shutil.copyfile(ROOT / 'src/data/atlas.json', downloads / 'suomen_rakennemuutosten_atlas.json')
    if not downloads_only:
        output.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(build / 'index.html', output / 'index.html')
        (output / 'data').mkdir(exist_ok=True)
        for name in DATA_FILES:
            shutil.copyfile(ROOT / 'src/data' / name, output / 'data' / name)
        (output / '.nojekyll').touch()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', type=Path, default=Path('/tmp/standalone-build'))
    parser.add_argument('--output', type=Path, default=ROOT / 'site')
    parser.add_argument('--downloads-only', action='store_true')
    args = parser.parse_args()
    package(args.build, args.output, args.downloads_only)
    print(f'Packaged current app and data in {args.output}')
