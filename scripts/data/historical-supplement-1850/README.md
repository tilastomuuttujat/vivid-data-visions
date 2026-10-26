# Rahoituksen, hintojen ja puunkäytön historiallinen täydennys

Erä `historical_finance_prices_1850_20261026_v1`: 32 indikaattoria, 4 774 arvoa. Näistä 26 on lähde-esityksiä ja kuusi eksplisiittisiä johdoksia. Kaikki alkavat 1800-luvulla; tietokannan aikaraja on 1850–2025. Tässä erässä todellinen ensimmäinen lähdevuosi on 1860. Puuttuvaa alkua ei täytetä.

## Lähdeversiot

- JST Macrohistory Database R6: Suomen 151 lähderiviä, 1870–2020. `jst-finland.csv` sisältää koko maapoiminnan, myös rakentamisessa käyttämättömät sarakkeet. Stata-liukulukujen 17 merkitsevän numeron merkkijonot toistavat lähteen binääriluvut; ne eivät merkitse 17 numeron mittaustarkkuutta. Alkuperäisen DTA-verkkovastauksen SHA-256 ja dokumentaation SHA-256 ovat manifestissa. Lähde ei päivity tämän erän toistossa.
- Tilastokeskus StatFin 11xy: elinkustannusindeksi 1860–2025, 1914:1–6=100. Tarkka POST-kysely, vastaus ja metadata tallennettu.
- Tilastokeskuksen vuosikirja 2025, taulukko 9.21; alkuperäistuottaja Luke: raakapuun käyttö 1860–2024. XLSX:n numeeriset OOXML-arvot ja solujen rivikoordinaatit on poimittu alkuperäisinä merkkijonoina. Excelin varastoima luku voi poiketa viimeisissä desimaaleissa näytöllä pyöristetystä luvusta. Työkirjaa ei muokattu. Tuontipuun sarake säilyy raakapoiminnassa, mutta sitä ei tuoda 1800-luvulla alkavaksi indikaattoriksi, koska Suomen ensimmäinen numeerinen arvo on 1924.

`sources/manifest.json` yksilöi hakemisajan, URL:n, lähdetiivisteet ja tallennetun poiminnan erillisen tiivisteen. PDF:t ja binäärityökirjat eivät ole tämän repossa säilytettävän numeerisen snapshotin tiedostoja; niiden lähdeosoitteet/tiivisteet ovat jäljitettävissä. Reproduktio paikallisesta snapshotista ei tarvitse niiden verkkohakua.

## Toistaminen

```bash
python scripts/data/historical-supplement-1850/build.py
python scripts/data/historical-supplement-1850/build-import.py
python -m unittest discover -s scripts/data/historical-supplement-1850 -p 'test_*.py'
```

Generoitunut `import.sql` suoritetaan murrosmatriisin PostgreSQL-kantaan (`zzbubbrsgiqsvsovkkmf`) hyväksytyllä SQL-asiakkaalla. SQL on atominen ja insert-only. Identtinen erä ei lisää kaksoiskappaleita; muuttunut sisältö samalla erätunnisteella hylätään. Tämän version lähdehaun `fetch.py` kieltäytyy korvaamasta jo jäädytettyä manifestia. Uudelle lähdevuosikerralle tehdään uudet erä- ja sarjatunnisteet. `--reuse-downloads` on vain alkuperäisen auditoinnin väliaikaistiedostojen käyttöön, ei verkosta päivittämiseen.

Rakentaminen ja testit käyttävät Pythonin standardikirjastoa. Uusi DTA-lähdepoiminta tarvitsee pandas-kirjaston. XLSX luetaan suoraan OOXML:stä ilman työkirjan uudelleentallennusta.

## Laskentasäännöt

Viisi prosenttisuhdetta lasketaan muodossa `100 × osoittaja / gdp`: yksityinen luottokanta, lavea rahamäärä, vaihtotase, julkisen sektorin tulot ja menot. Molemmat nimellismäärät ovat saman JST-version miljoonia uusia Suomen markkoja. Luottokannan ja rahamäärän suhde BKT:hen vertaa kantaa vuosivirtaan; ne eivät ole tuotannon summattavia osia.

Reaalipalkkaindeksi on `100 × wage / cpi`, molempien lähdeindeksien perusvuosi 1990=100. Lähteen teollisuuspalkkojen ja myöhempien keskimääräisten vuosipalkkojen ketju säilyttää määritelmäkatkokset. Indeksi ei mittaa käytettävissä olevia kotitaloustuloja eikä samaa muuttumatonta työntekijäryhmää koko jaksolla.

## Tulkinta ja yhteiskuvaaja

- Kaikki tuodut arvot luokitellaan konservatiivisesti arvioiksi. Julkaisu tarkoittaa lähteistettyä kuvailevaa kontekstia; alkuperäislaskelmia ei ole riippumattomasti toistettu.
- Pankkien pääomaosuus `lev` on pääoma / kaikki taseen varat, ei nykyinen Basel-vakavaraisuussuhde riskipainotettuihin saamisiin. Vuodet 1990–1991 ovat lähteen interpoloimia: rivit on merkitty `source_interpolated=true` ja `breakpoint_eligible=false`.
- Korot ovat prosentteja, sijoitustuotot suhdelukuja. Esimerkiksi sijoitustuotto 0.05 tarkoittaa 5 %. Valuuttakurssit ja nimellisarvot on yhdenmukaistettu lähteen uuteen markkaan; euroajan luvut eivät tarkoita liikkeessä olevia markkoja.
- Rahamäärän, pankkien, julkisen sektorin ja palkkojen lähderajaukset vaihtelevat. Energiapuun käyttökäsitteen muutos 1993 on merkitty sarjaan ja riviin.
- Kriisi- ja valuuttakurssikiinnitykset ovat 0/1-luokituksia, eivät vaikutuksen suuruutta. Ei automaattista käyrän tasoitusta.
- Riippuvuusklusterit ja laskentasyötteet on tallennettu. Kaikilla sarjoilla `include_in_composite=false`, paino null ja vain kontekstiyhteys. Uudet esitykset eivät kumuloi kokonaisvaikutusta havaintomäärän kasvaessa.
- Aiemmat sarjat sekä päämittari- ja historialliset rekisterit säilyvät. StatFinin jo kattavasti kerättyjä tuotanto-/työpanossarjoja ja samoja vankilukusarjoja ei tuoda uudestaan. JST:n 1900-luvulla alkavia asuntohinta-, asuntolaina-, kotitalousluotto- ja työttömyyssarjoja ei sisällytetä tähän 1800-luvulla alkavien sarjojen erään.

## Aineistolisenssit ja viitteet

JST:n Suomen poiminta, sen tiedot erätiedostossa ja JST:stä johdetut laskelmat jaetaan **CC BY-NC-SA 4.0** -ehdoin; tätä aineistoa ei saa tulkita muun repositorion mahdollisen yleisen koodilisenssin alaiseksi. Lähteen lisenssi: https://creativecommons.org/licenses/by-nc-sa/4.0/ . StatFin/Luke-aineiston alkuperäistuottaja ja lähde on nimettävä; alkuperäisten lähteiden käyttöehdot säilyvät.

- Òscar Jordà, Moritz Schularick, Alan M. Taylor (2017). *Macrofinancial History and the New Business Cycle Facts*. NBER Macroeconomics Annual 2016, volume 31.
- Sijoitustuotot: Òscar Jordà, Katharina Knoll, Dmitry Kuvshinov, Moritz Schularick, Alan M. Taylor (2019). *The Rate of Return on Everything, 1870–2015*. Quarterly Journal of Economics 134(3), 1225–1298.
- Pankkien tasesuhteet: Òscar Jordà, Björn Richter, Moritz Schularick, Alan M. Taylor (2021). *Bank capital redux: solvency, liquidity, and crisis*. Review of Economic Studies 88(1), 260–286.
- https://www.macrohistory.net/database/ — R6-lähde ja dokumentaatio, Suomen menetelmät painetuilla sivuilla 62–70.
- Tilastokeskus, kuluttajahintaindeksi, StatFin 11xy: https://pxdata.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__khi/11xy.px/
- Tilastokeskus, Suomen tilastollinen vuosikirja 2025, taulukko 9.21; SVT: Luonnonvarakeskus: metsäteollisuuden puunkäyttö ja puun kokonaiskäyttö. Tarkka XLSX-osoite manifestissa.

Staattisia verkkonäkymien vientiaineistoja ei muuteta tässä erässä.
