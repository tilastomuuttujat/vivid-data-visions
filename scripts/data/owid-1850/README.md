# OWID: Suomen 35 sarjaesitystä vuodesta 1850

Erä `owid_finland_1850_2025_20261026_v1` kattaa keskustelussa luetellut 35 esitystä, 33 OWID-kuvaajalähteestä. Tämä ei ole koko OWID-katalogin täydellinen inventaario.

Tietokantaan tuodaan vain Suomen lähdearvot vuosilta 1850–2025. Sarjan puuttuvaa alkua tai vuosia ei interpoloida. Syntymäkohortti erotetaan kalenterivuoden havainnosta, luokkakoodi jatkuvasta mittarista ja ennuste historiasta. Kaikki lähdearvot merkitään konservatiivisesti arvioiksi tai ennusteiksi: snapshotin tarkistus ei ole alkuperäislähteiden riippumaton validointi.

## Toistaminen

```bash
python scripts/data/owid-1850/build.py
python scripts/data/owid-1850/build-import.py
python -m unittest discover -s scripts/data/owid-1850 -p 'test_*.py'
```

Generoitunut `import.sql` on yksi atominen, insert-only PostgreSQL-tuonti. Suorita se projektissa `zzbubbrsgiqsvsovkkmf` hyväksytyllä SQL-asiakasohjelmalla. Sama sisältö ei lisää rivejä uudelleen; muuttunut sisältö samalla erätunnisteella hylätään. Tuonti tarkistaa sarja- ja rivimäärät sekä julkaisurajaukset. Verkkohaun uusintaa ei tarvita tallennetun version toistamiseen.

`fetch.py` käyttää OWID:n dokumentoitua Grapher API:a. Se säilyttää olemassa olevat poiminnat oletuksena. Uuden lähdeversion keräämisessä käytä uutta erähakemistoa ja uusia erä-/sarjatunnisteita; `--refresh` korvaa paikalliset lähdepoiminnat eikä ole saman jäädytetyn erän uusintatuonti.

`sources/` sisältää Suomen CSV-rivit kaikilta lähteen vuosilta (myös ennen 1850 ja mahdollisia myöhempiä ennustevuosia), täydellisen kuvaajametadatan sekä hakukuitin. CSV:n numeromerkkijonot säilyvät; koko verkkovastauksen ja tallennetun maapoiminnan SHA-256-tiivisteet ovat erilliset. Tietokannan aikarajaus on rakennusvaiheessa, ei raakapoiminnan karsintana. OWID-URL on muuttuva; tämä lähdeversio yksilöidään tallennetulla sisällöllä ja tiivisteillä, ei oletuksella muuttumattomasta URL:sta. Alkuperäislähteiden viitteet ja OWID-menetelmäkuvaukset säilyvät metadatassa.

## Julkaisurajaukset

- Kahdeksan ennustearvoa: väestötiheys 2024–2025 ja kolme koulutussarjaa 2015/2020. Tähän erään ei kuulu vuosien 2026–2050 ennusteita.
- Kymmenen V-Dem-esityksen vuodet ennen vuotta 1918 pidätetty emävaltio-/territorioprovenienssin rivitason tarkistukseen. Tämä ei tarkoita, että jokainen arvo olisi todettu virheelliseksi.
- Koko korkea-asteen koulutuksen sarja pidätetty: completed/incomplete-määritelmäristiriita.
- Koko HYDE-kaupungistumissarja pidätetty Suomen historiallisten tasojen ja määritelmän validointiin.
- Koko HYDE:n rakennetun alueen sarja pidätetty: maakohtainen aggregaatti vs. `km² per grid cell` -yksikkö.
- Muut julkaistavat arvot ovat lähteistettyä kuvailevaa kontekstia. Ei automaattista kansallisten sarjojen korvausta, indeksipainoa eikä syyvaikutusväitettä. Saman alkuperäisaineiston eri esityksiä ei lasketa riippumattomiksi todisteiksi.

`verification.json` dokumentoi tietokannan rivivertailun ja idempotenssin tarkistuksen. Verkkonäkymien staattisia vientiaineistoja ei muuteta tässä erässä.
