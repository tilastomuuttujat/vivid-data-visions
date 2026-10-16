# Vivid Data Visions — Minkä varaan Suomi rakentuu?

Laadullinen Suomen rakennemuutosten atlas, ankkuripolut, Observatorio, Planeetta,
Murrokset ja tilastosarjoja kokoava Laboratorio. Karttojen sijainnit ovat
teemallisia tulkintoja. Relaatiot ja ajallinen peräkkäisyys eivät yksin osoita
syy-yhteyttä.

## Kehitys ja tarkistukset

Node.js/npm tai Bun sekä Python 3 ja openpyxl 3.1.5:

```sh
bun install --frozen-lockfile
python3 -m pip install openpyxl==3.1.5
npm run dev
npm test
npm run test:data
npm run typecheck
```

`npm run dev` ja `npm run build` muodostavat ensin ajan tasalla olevat
latauspaketit. `npm run build:site` kokoaa GitHub Pages -sivuston `site/`-kansioon.
GitHub Actions ajaa tyyppitarkistuksen, React-testit ja Pythonin datatestit ennen
julkaisua. Pull requesteista tuotetaan ladattava `site-preview`-artefakti;
tuotantoon julkaistaan vasta päähaarasta.

## Ladattavat versiot

Kaikki paketit tehdään samasta standalone-koonnista ja samoista JSON-tiedostoista:
`atlas-2d.zip`, `atlas-3d.zip` ja `minka-varaan-suomi.zip`. Kussakin on HTML,
`data/atlas.json`, `data/anchors.json`, `data/maakunnat.json` ja `LUEMINUT.txt`.
2D- ja 3D-paketit avaavat vastaavan oletusnäkymän. Pakettien muodostaminen:

```sh
npm run build:downloads
```

Latauslinkit käyttävät Viten julkaisupolkua, joten ne toimivat myös GitHub Pagesin
repositorion alihakemistossa. Älä ylläpidä generoitujen HTML- tai ZIP-tiedostojen
sisältöä käsin; julkaisu muodostaa ne uudelleen.

## Lainsäädäntöaineiston pysyvät tunnisteet

Päätöksen `d001`-tyyppinen tunniste on pysyvä eikä tarkoita Excelin rivinumeroa.
Ennen vanhan Excelin uudelleenjärjestelyä tai otsikoiden muokkaamista lisää
pysyvä `Päätöstunniste`-sarake migraatiolla:

```sh
python3 scripts/data/convert-lainsaadanto.py alkuperainen.xlsx --write-ids tunnisteilla.xlsx
python3 scripts/data/convert-lainsaadanto.py tunnisteilla.xlsx
```

Migraatio tunnistaa vanhat päätökset nykyisen JSON:n täsmällisestä päätöstekstistä
ja ajankohdasta, säilyttää niiden tunnisteet ja varaa uusille päätöksille uudet
numerot. Ilman migraatiota uusilta päätöksiltä edellytetään käsin annettua
uniikkia tunnistetta. Säilytä sarake jatkossa; myös valmistelu- ja
rahoitustaulukoissa voi käyttää sitä tekstipohjaisen viittauksen sijaan.
Kohdentamattomat valmistelurivit säilytetään erikseen JSON:n
`kohdentamatonValmistelu`-kentässä ja niistä ilmoitetaan tuonnissa. Niistä ei
muodosteta päätösviitteitä. Virheellinen eksplisiittinen tunniste pysäyttää tuonnin.

Poistuvat aiemmat päätöstunnisteet pysäyttävät tuonnin. Tarkoituksellinen poisto
vaatii `--allow-removals`-valinnan sekä juurisyypolkujen ja verkostovastineiden
päivityksen. Tuntematon arvio pysäyttää tuonnin. Neutraalit ja arvioimattomat
kohdat erotetaan vahvistavista; tarvittaessa anna `Arvioluokka`-sarakkeessa yksi
arvoista `vahvistava`, `heikentava`, `korjaava`, `ristiriitainen`, `neutraali`,
`arvioimaton`.

## Ylläpitoeditori

`?admin` avaa kirjautumisen. Rajaa GitHub-token tämän repositorion sisältöön.
Token säilyy vain selainistunnossa; aiempi pysyvästi tallennettu token poistetaan
sivun latauksessa. Kirjautuminen tarkistaa, että sivun aineisto vastaa valittua
haaraa. Julkaisu tarkistaa lähtöversiot, tallentaa kaikki muutokset yhteen
committiin ja päivittää haaran vain ilman pakotusta. Ristiriidassa muutokset
säilyvät selaimessa ja ne voi ladata talteen; mitään ei yhdistetä automaattisesti.

TTT-verkostoaineiston alkuperä ja ylläpito: [NETWORK.md](src/components/murrokset/NETWORK.md).

## Lovable

Projekti on yhdistetty [Lovable-editoriin](https://lovable.dev/projects/4933e9a2-6acd-4b9c-ac1f-a0109b9fbf20).
Julkaistua git-historiaa ei saa kirjoittaa uudelleen.
