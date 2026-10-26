# Kaikki 1800-luvun mittarisarjat ja lähdepäivitysten tarkistus

## Mitä muutettiin?

Aiempi 18 päämittarin valinta oli suppea esityskerros. Sen rinnalle on nyt muodostettu kattava historiallinen mittarirekisteri: kaikki 142 indikaattorisarjaa ja 394 julkisen talouden sarjaa, joilla on tietokannassa havaintoja vuosilta 1850–1899. Kaikki 536 sarjaa sisältyvät rekisteriin; yksittäisten sarjojen lähde- ja laskentakelpoisuutta ei oleteta samaksi. Nykyiset päämittarit ja aiemmat hyväksynnät säilyvät.

## Tarkistuksen tulokset

- Rekisterissä on 3420 indikaattorihavaintoa ja 4006 julkisen talouden havaintoa vuosilta 1850–1899. Lähdeperheet voivat sisältää samaa tietoa.
- Kaikki 27 ilmoitettua verkkolähdettä ovat saatavilla. 17 PDF-osoitteen sisältötiiviste täsmää aiemmin tallennettuun. Saman dokumentin eri osoitteita ei pidä tulkita riippumattomiksi lähteiksi.
- StatFin 15ai-, 12am- ja 12aq-aineistoihin verrattiin 85 sarjaa ja 12012 tallennettua solua. Luku kattaa myös sarjojen jo tallennetut myöhemmät vuodet. Numeerisia eroja löytyi 0.
- Tarkistus kattaa 15ai-sarjojen 38 varsinaista indikaattoriversiota ja niiden 38 julkisen talouden vastinetta sekä yhdeksän väestö-/kuolleisuussarjaa. Lähdeperheiden vastineet eivät ole 76 riippumatonta mittaria.
- Alkuperältään vielä varmistamattomista kolmesta CSV-aineistosta on 49 sarjaa. Ne sisältyvät rekisteriin, mutta eivät läpäise laskentakäyttöön hyväksymistä.
- Kahdella Tilastokeskuksen liiteaineistolla ei ole lähderekisterissä suoraa URL-osoitetta. Uudemman 15ai-liitteen kaikki 38 sarjaa voitiin silti kohdistaa nykyiseen rajapintaan ja arvot täsmäsivät. Vanhaa 019-liitettä ei automaattisesti ketjuteta siihen.

## Käyttöluokat

| Luokka | Sarjoja |
|---|---:|
| existing_checked_descriptive_cells | 313 |
| estimate_or_derivation_review | 86 |
| verified_current_numeric_snapshot | 85 |
| provenance_or_publication_review | 52 |

- verified_current_numeric_snapshot: kaikkien sarjan tallennettujen solujen numeerinen vastine tarkistettu nykyisestä StatFin-lähteestä. Hyväksyntä koskee kuvailevaa käyttöä ja säilytettyjä määritelmiä, ei syyvaikutusta.
- existing_checked_descriptive_cells: sarjassa on aiemmin lähdetarkistettuja julkaistuja havaintoja. Kelvolliset vuodet ja solumäärät on yksilöity; uusintatarkistus ei varmistanut kaikkia lukuja uudelleen.
- estimate_or_derivation_review: arvio tai johdettu luku tarvitsee oman laskentamenetelmän tarkistuksen. Historiallista tutkimusarviota ei muuteta mitatuksi havainnoksi.
- provenance_or_publication_review: lähdealkuperä, lähdeosoite, julkaisukelpoisuus tai tarkistustaso estää toistaiseksi laskentakäytön.

## Yhteismitallisuus ja päällekkäisyys

Kaikki sarjat eivät ole erillisiä yhteiskunnallisia tekijöitä. Esimerkiksi saman arvonlisäyksen markkamäärä, volyymi-indeksi ja toimialaosuus ovat saman ilmiön eri esityksiä. Alueet, sukupuolet, ikäryhmät, kokonaisuudet ja osat ovat omia ulottuvuuksiaan. registry.json sisältää eksplisiittiset 15ai-vastineiden konseptiryhmät. Muiden lähteiden ryhmittely säilyy varovaisena; täydellistä semanttista duplikaattiratkaisua ei väitetä.

Rekisteriin lisääminen ei anna painoa. Yhteisindeksin painot ja normalisointi ovat määrittelemättä. Näin uuden dokumentin tai rinnakkaissarjan lisääminen ei itsessään nosta vuoden yhteiskuntapistettä.

## Päivitysten tila

Tässä tarkistuksessa ei löytynyt eroja uudelleen verrattuihin numeerisiin arvoihin eikä niihin tehty arvojen korvauksia. Verkkosivun saatavuus tai samana pysynyt PDF ei todista alkuperäisen tilaston virheettömyyttä. Rikostilastokoosteen sivuston ilmoittama versio on edelleen 1.2 (30.9.2025); StatFin 15ai:n näkyvä viimeisin päivitys on 18.9.2026 ja sarjapää 2025*.

Julkaistujen lähteiden kaikki uudet mahdolliset vuosihavainnot eivät ole tämän tarkistuksen lupaus: StatFin-vertailu tarkisti olemassa olevat solut. Muiden lähteiden pidemmät uudet taulukot, muuttuneet määritelmät tai tuoreemmat tutkimusrekonstruktiot vaativat erillisen poiminnan. Tarkistus ei ole koko tutkimuskirjallisuuden kattava uusien aineistojen haku.

## Seuraava käyttö

Historiallisen tarkastelun tulee hakea tästä laajasta rekisteristä ajanjakson kannalta olennaiset mittarit, eikä rajautua 18 päämittariin. Päänäkymä voi säilyä pelkistettynä: tuotanto, väestö ja kuolleisuus, elinkeinorakenne sekä köyhäinhoito. Tarkennuksissa avataan toimialat, alueet, koulutus, asuminen, kontrolli ja muut saatavilla olevat ilmiöt.

Puuttuvia välivuosia ei interpoloida automaattisesti. Elinajanodotteen monivuotiset jaksot, tutkimusten vuosikymmenpisteet ja vuositilastot erotetaan toisistaan. Nykyisiä tulonjakokäsitteitä tai työttömyysastetta ei siirretä 1800-luvulle. Historialliset markat ja kansantalouden tilinpidon sarjoissa käytetyt nykymarkat erotetaan; vuoden 1963 muunnosta ei tehdä kahdesti.

## Toistettavuus

Lähdepoiminnat ja kyselyt ovat scripts/data/historical-metrics-kansiossa. check-sources.py tarkistaa lähteiden saavutettavuuden ja PDF-tiivisteet; check-live-series.py ja check-finance-copies.py vertaavat numeeriset solut; build-registry.py muodostaa rekisterin jäädytetyistä aineistoista. Lähdearvoja ei muuteta. Koostetta voi päivittää uudella versionumerolla, kun lähdearvo tai menetelmä muuttuu.
