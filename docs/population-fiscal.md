# Väestöpohja ja julkisyhteisöjen tehtävämenot

Täydennys kytketään artikkeleihin **Tulevaisuuden tilit** ja **Miten valtio rahoittaa toimintansa, ja mitä velka merkitsee?** Alkuperäistekstit säilyvät; menojen rakenne ja väestö esitetään eri suureina. Menot eivät yksin osoita rahoituksen kestävyyttä tai tiettyä sopeutustarvetta.

## Vertailu samasta lähdeversiosta

| Mittari | 2001 | 2024* |
|---|---:|---:|
| Sosiaaliturva G10, milj. euroa käyvin hinnoin | 27 746 | 73 006 |
| Sosiaaliturva G10, % BKT:sta | 19,2 | 26,4 |
| Vanhuus G1002, milj. euroa käyvin hinnoin | 11 001 | 42 720 |
| Vanhuus G1002, % BKT:sta | 7,6 | 15,5 |
| Vanhuuden osuus sosiaaliturvamenoista, laskettu % | 39,6 | 58,5 |
| 65 vuotta täyttäneet, väestöpohja | 787 371 | 1 328 817 |

*2024 on lähteen ennakkotieto. Julkaisuversio on 18.12.2025; vuoden 2025 menoja ei ole tässä tilastossa vielä saatavilla tarkistuspäivänä 6.11.2026. BKT-osuudet säilytetään lähteen omina: niitä ei yhdistetä myöhemmän BKT-julkaisun lukuihin.

Menorakenne painottui vertailuvuosien välillä enemmän vanhuuden tehtävään. Tämä ei tunnista ikääntymisen kausaalista kustannusvaikutusta. Väestön, etuuksien, indeksien, palvelujen määrän ja kustannusten sekä muiden päätösten osuudet vaativat omat aineistonsa.

## Käsitteelliset erot

- **Sektori S13:** kaikki julkisyhteisöt, myös paikallishallinto ja sosiaaliturvarahastot; ei pelkkä valtion budjetti.
- **Taloustoimi OTES:** sulautetut menot, joissa julkisyhteisöjen välisiä tulonsiirtoja ei lasketa uudelleen lopullisten menojen päälle.
- **COFOG G10:** julkisyhteisöjen sosiaaliturvan tehtäväluokka. Se ei ole sama asia kuin Kelan perustoimeentulotuki tai THL:n sosiaaliturvan menot ja rahoitus -tilaston kokonaisuus.
- **G1002 vanhuus:** tehtäväluokka, ei kaikkien 65 vuotta täyttäneiden saamat etuudet ja palvelut. Terveydenhuolto on erillinen päätehtävä G07, ja esimerkiksi työkyvyttömyysetuuksia kuuluu muihin tehtäviin.

65 vuotta täyttäneiden määrää ei käytetä G1002-menojen etuudensaajien lukumääränä. Tästä ei lasketa menoa saajaa kohti tai vanhuuden kokonaiskustannusta. Myöskään pää- ja alatehtäviä ei summata päällekkäin.

## Hintataso ja menojen määrä

Rahamäärät sekä lähteen eurot asukasta kohti ovat käypähintaisia. BKT-osuus ei ole inflaatiokorjaus: se muuttuu myös nimittäjän vuoksi. Tehtäväkohtaiset hinta- tai volyymi-indeksit puuttuvat tästä aineistosta, joten reaalikasvua tai palvelumäärän muutosta ei lasketa. Yleistä kuluttajahintaindeksiä ei oleteta kaikkien julkisten tehtävien kustannusindeksiksi.

Lähde sisältää kaikki kymmenen päätehtävää vuosilta 1990–2024 ja sosiaaliturvan yhdeksän alatehtävää vuodesta 2001. Varhaisten alatehtävien puuttuvat arvot säilyvät puuttuvina, eivät nollina. Yksiköt ovat miljoonaa euroa, prosenttia BKT:sta ja euroa asukasta kohti. Tehtävien summat tarkistetaan lähteen pyöristystarkkuuden sallimissa rajoissa; summia ei pakoteta täsmäämään muuttamalla lähdelukuja.

## Merkitys artikkeleille

Väestöpainetta tulee tarkastella tehtävittäin eikä yhtenä julkisen talouden ikääntymiskertoimena. Lasten koulutus, työikäisten toimeentuloturva ja vanhimpien hoiva tarvitsevat eri tietopohjat. Rahoituksen saatavuus, menojen kohdentuminen ja yhteiskunnan toimintakyky säilyvät erillisinä arviointikysymyksinä.

Jäljellä on tehtäviin soveltuvien kustannus- ja volyymi-indeksien, etuuskohtaisten saajien ja etuustasojen, ikäprofiilien sekä tulojen ja verojen kytkeminen. Tässä ei arvioida kestävyysvajetta eikä jatketa menoja väestöennusteella vuoteen 2050.

## Lähteet ja toistaminen

- [StatFin 12a6: julkisyhteisöjen menot tehtävittäin](https://pxdata.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__jmete/statfin_jmete_pxt_12a6.px/)
- [Tilaston dokumentaatio](https://stat.fi/fi/dokumentaatio/tilastojen-dokumentaatio/jmete)
- Yhteisen väestöpohjan 11rc, 65 vuotta täyttäneet 2001 ja 2024.

Alkuperäisvastaukset, metatiedot, kysely ja SHA-256: `scripts/editorial/sources/population-fiscal/`. Keruu: `python scripts/editorial/collect_population_fiscal.py`; ei kirjoita tietokantaan. Testit: `python -m unittest discover -s scripts/editorial -p 'test_population_fiscal.py'`.

Turson `editorial__population_fiscal` säilyttää yhteisen lähdekuvan ja laskennan; kaksi artikkelikytkentää ovat nykyisessä täydennystaulukossa. Tuonti tarkistaa artikkelirevisiot, tekstitiivisteet ja tallennukset uudella yhteydellä.
