# Hoivan väestöpohja ja toteutunut kotihoito

Kytkentä koskee artikkeleita **Lisävuodet eivät vielä kerro, millaista elämä on** ja **Kenen vastuulla on ihminen, joka ei selviydy?** Alkuperäistekstit säilyvät; uudet lähdetäydennykset näkyvät nykyisessä väitematriisissa. Väestö, palvelujen käyttö ja hoivan tarve erotetaan.

## Vanhimmat ikäryhmät

| Vuosi | Vähintään 75-vuotiaat | Vähintään 85-vuotiaat | Luonne |
|---|---:|---:|---|
| 1950 | 79 015 | 9 463 | Toteutunut |
| 1990 | 283 068 | 51 943 | Toteutunut |
| 2025 | 675 448 | 170 776 | Toteutunut |
| 2030 | 766 645 | 206 262 | Vuoden 2024 ehdollinen ennuste |
| 2050 | 896 285 | 368 086 | Vuoden 2024 ehdollinen ennuste |

85 vuotta täyttäneet sisältyvät 75 vuotta täyttäneisiin. Toisensa poissulkevat laskentaryhmät ovat 65–74, 75–84 ja 85+. Kaikkien vuosien ryhmäsummat tarkistetaan yhteistä väestöpohjaa vasten. Historia kattaa 1865–2025 ja ennuste 2026–2050.

Vuoden 2024 ennusteessa 85 vuotta täyttäneiden määrä olisi vuonna 2050 yli kaksinkertainen vuoden 2025 toteumaan verrattuna. Tämä ei ole hoivan tarpeen tai kustannusten ennuste. Laskelma käyttää julkaistuja vuoden 2024 syntyvyys-, kuolleisuus- ja muuttoliikeoletuksia, eikä sitä ole päivitetty vuoden 2025 toteumasta.

## Vuoden 2025 toteutunut palvelukäyttö

THL:n tilastoraportin 31/2026 sivulla 2 kotihoidon asiakkaita on 163 055 ja säännöllisen kotihoidon asiakkaita 110 479. Vähintään 75-vuotiaita säännöllisiä asiakkaita on pyöristettynä 88 000, ja lähteen julkaisema peittävyys on 13 %. Vähintään 85-vuotiaiden julkaisema peittävyys on 29 %. Ikäryhmät ja niiden osuudet ovat sisäkkäisiä.

Asiakas tarkoittaa vuoden aikana vähintään yhden kotikäynnin saanutta. Säännöllisyys edellyttää käyntejä vähintään kuutena päivänä 60 vuorokauden aikana. Raportti koskee julkisesti järjestettyä kotihoitoa, ei yksityisesti järjestettyä hoitoa tai kaikkea hoivaa.

Saman raportin vertailussa säännöllisten asiakkaiden määrä kasvoi 2 253 henkilöllä vuodesta 2024. Ostopalvelutietojen kattavampi toimittaminen selittää osaltaan kasvua. Puutteita oli yhä lähes kaikilla hyvinvointialueilla; Ahvenanmaan tiedot olivat osittain puutteellisia. Sivulla 1 säännöllisten osuus kaikista asiakkaista on 67 % ja sivulla 2 68 %; tätä ristiriitaista osuutta ei käytetä täydennyksessä. Vanhan vuoden 2024 julkaisun lukuja ei yhdistetä tähän uudeksi korjaamattomaksi aikasarjaksi.

## Merkitys artikkeleille ja jäljelle jäävä näyttö

Yli 65-vuotiaiden yhteismäärä peittää vanhimpien ikäryhmien eritahtisen muutoksen. Hoivan mittakaavan tarkastelu tarvitsee täsmällisemmät ikäryhmät sekä tietoa toimintakyvystä ja palvelun intensiteetistä. Asiakasmäärän kasvu ja suhteellisen peittävyyden lasku voivat esiintyä yhtä aikaa, mutta ne eivät yksin osoita palvelujen riittävyyttä.

Aineisto ei osoita hoivavastuun siirtymistä läheisille eikä mittaa täyttymätöntä avuntarvetta. Niitä varten tarvitaan palvelutarpeen arviointeja, toimintakykyä, odotusaikoja, omaishoitoa ja läheisten ajankäyttöä samoilta alueilta ja vuosilta. Nykyistä kotihoidon peittävyyttä ei kerrota vuoden 2050 väestöllä palvelutarpeen ennusteeksi.

## Lähteet ja tarkistukset

- Yhteisen väestöpohjan [11rc](https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vaerak/11rc.px) ja [128t](https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vaenn/128t.px), niiden tarkat kyselyt ja alkuperäistiivisteet.
- [THL: Kotihoidon käynnit ja asiakkaat 2025](https://www.julkari.fi/server/api/core/bitstreams/d4be92c3-6048-48ca-a65d-48c7ce99c941/content), julkaistu 30.9.2026. Sivut 1–2 ja 20 tarkistettu visuaalisesti. Tarkistus kattaa käytetyt luvut, määritelmät ja laatuhuomiot, ei koko raportin taulukoiden digitointia.

Rakenteinen lähdetarkistus ja alkuperäisen PDF:n SHA-256: `scripts/editorial/sources/homecare2025-review.json`. Johdettu yhteinen aineisto tallentuu Turson `editorial__population_care`-tauluun; kaksi artikkelikytkentää nykyiseen täydennystaulukkoon. Tarkistukset: `python -m unittest discover -s scripts/editorial -p 'test_population_care.py'`. Tuonti tarkistaa artikkelirevision, tekstitiivisteen ja tallennuksen uudella yhteydellä.
