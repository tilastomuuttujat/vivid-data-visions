# Sosiaaliturvan väestöpohja: perustoimeentulotuen saajat

Ensimmäinen etuuskohtainen kytkentä koskee artikkeleita **Oikeus turvaan, mutta millä ehdoilla?** ja **Väheneekö avun tarve vai vain avun saaminen?** Uudet lähdetäydennykset säilyvät erillään alkuperäisteksteistä. Kahden vuoden rekisterikuvaus ei osoita politiikan vaikutusta tai alikäytön määrää.

## Lähdetarkistetut luvut

| Mittari | 2024 | 2025 |
|---|---:|---:|
| Ikä- ja sukupuolitaulukon saajahenkilöt yhteensä | 356 437 | 365 029 |
| 20–24-vuotiaat saajahenkilöt | 42 509 | 42 591 |
| Saajakotitaloudet | 249 576 | 256 916 |
| Yksin asuvien saajakotitaloudet | 155 307 | 159 324 |
| Yksinhuoltajien saajakotitaloudet | 28 002 | 28 295 |

Kummankin vuoden lähteestä tallennetaan 36 ikä- ja sukupuolisolua sekä kuusi kansallista kotitalouslukua. Ikäluokat ovat viisivuotisluokkia 0–4:stä 80–84:ään ja avoin 85+. Molempien sukupuolten luvut summataan ikäluokittain. Kotitalousluokat täsmäävät kansalliseen summaan.

## Merkitys artikkeleille

Väestöpainetta tulee tarkastella etuuskohtaisesti. Hoivan vanhimpien ikäryhmien kasvu ja perustoimeentulotuen ikäjakauma kuvaavat eri tehtäviä. Yhden etuuden saajat eivät kuvaa koko sosiaaliturvan käyttöä tai kaikkia vaikeuksissa olevia.

Artikkelien ero avun tarpeen ja avun saamisen välillä säilyy. Saajamäärän muutos voi liittyä toimeentuloon, muiden etuuksien muutoksiin, tuen ehtoihin, hakemiseen, väestöryhmien kokoon tai kirjaamiseen. Kahdesta vuosipoikkileikkauksesta ei tunnisteta näiden osuuksia eikä syitä, joiden vuoksi henkilö tuli tuelle tai poistui siltä.

## Rajaukset

- Henkilömäärä kattaa tukea saaneiden kotitalouksien henkilöitä. Lapsi saajatilastossa ei tarkoita itsenäistä hakijaa.
- Henkilöt, kotitaloudet, hakemukset ja tukikuukaudet ovat eri mittareita. Kotitalouden tyyppi määräytyy vuoden viimeisen maksun mukaan.
- Sama ikäluokka kahtena vuonna ei ole sama kohortti. Raakasaajamäärä ei ole ryhmän saamisriski: ikäryhmät ovat erikokoisia.
- Tässä ei lasketa osuuksia yhteisen väestöpohjan koko Suomen luvuilla. Nimittäjän maantiede, ikämääritelmä, viiteaika ja vuosittaisen henkilöjoukon yhteensopivuus on tarkistettava ensin. Ikävakiointia ei tehdä.
- Tarkastelu koskee Kelan perustoimeentulotukea. Hyvinvointialueiden täydentävä ja ehkäisevä toimeentulotuki sekä muut etuudet jäävät sen ulkopuolelle.
- Tilasto ei kerro kaikkia etuuteen oikeutettuja, täyttymätöntä avuntarvetta tai alikäyttöä. Vuodelle 2050 ei johdeta etuusennustetta väestöennusteesta.

## Lähteet ja toistaminen

- [Kelan perustoimeentulotukitilasto 2024](https://tilastojulkaisut.tietotarjotin.fi/perustoimeentulotuki/2024/)
- [Kelan perustoimeentulotukitilasto 2025](https://tilastojulkaisut.tietotarjotin.fi/perustoimeentulotuki/2025/)

Tarkistus 6.11.2026: katsauksen sukupuoli- ja ikätaulukko sekä taulukon 2 kansallinen kotitalousrivi. Julkaisut sisältävät myös muita taulukoita; niitä ei ole tässä digitoitu tai hyväksytty vaikutusnäytöksi.

Poimitut alkuperäisluvut, tarkat paikantimet, keruuaika ja alkuperäisen HTML:n SHA-256 ovat hakemistossa `scripts/editorial/sources/population-security/`. Koko julkaisun suurta HTML-tiedostoa ei monisteta repon aineistoksi. Toistettava poiminta: `python scripts/editorial/collect_population_security.py` (tai paikallisen alkuperäis-HTML:n hakemisto argumentiksi). Poiminta tarkistaa taulukoiden otsikot ja ikäluokkien kattavuuden; se ei kirjoita tietokantaan.

Tarkistukset: `python -m unittest discover -s scripts/editorial -p 'test_population_security.py'`. Turson `editorial__population_security` säilyttää yhteisen lähdekuvan ja laskennan; kaksi artikkelikytkentää ovat nykyisessä täydennystaulukossa. Nykyiset revisiot, tekstitiivisteet ja tallennukset varmennetaan uudella yhteydellä.

Seuraava sosiaaliturvan sisältöaukko on yhteensopiva ikäryhmittäinen väestönimittäjä sekä tulo-, meno-, hakemus-, päätös- ja seurantatieto. Alikäytön arviointi tarvitsee erillisen oikeutettujen joukon arvion.
