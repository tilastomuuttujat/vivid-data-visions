# Nykyisen aineiston laskentakelpoisuus, 26.10.2026

## Johtopäätös

Aineisto riittää rajattujen mitattujen kehityskäyrien ja kolmen olemassa olevan hajotelmamallin hyödyntämiseen. Se ei vielä oikeuta yhdeksän lohkon yhteismitallista kokonaisindeksiä vuosille 1850–2050. Tämän kartoituksen A-luokka tarkoittaa rakenteellista käyräehdokasta, ei hyväksyttyä kansallista päämittaria tai syyvaikutusta. Yhtään sarjaa ei hyväksytä automaattisesti kokonaisindeksiin.

## Laajuus ja rajaus

Indikaattorirekisteri: 1609 sarjaa, 596464 riviä ja 28491 sarja–ryhmä-yhdistelmää. Julkisen talouden erillisrekisteri: 32661 sarjamääritelmää ja 970849 havaintoriviä; 561 määritelmällä ei ole havaintoja. Perheitä ei summata riippumattomaksi havaintomääräksi: sama alkuperäinen tieto voi esiintyä useassa paikassa.

Kartoitus perustuu nykyiseen tietokantaan. Se ei hae alkuperäislähteitä uudelleen eikä tarkista yksittäisten tilastolukujen oikeellisuutta. Sarjakatalogi luokiteltiin kokonaan; julkinen talous auditoitiin kaikkien sarjojen aggregaateista lähde-, yksikkö-, hinta-, valuutta- ja tilinpitokehysryhmittäin. Julkisen talouden yksittäisiä sarjoja ei rinnasteta indikaattorikatalogin A–E-luokkiin. Kyselyt ovat vain lukevia. Lähdepoiminnat tehtiin peräkkäin, eivät yhden tietokantatransaktion snapshotina.

## Laskentakelpoisuuden luokat

- A_curve_candidate: 1073 sarjaa.
- B_sparse_or_frequency_review: 336 sarjaa.
- C_model_or_estimate_review: 112 sarjaa.
- D_metadata_review: 17 sarjaa.
- D_provenance_review: 71 sarjaa.

- A: julkaistu vuosisarja, yksikkö määritelty, vähintään yhdessä samassa ryhmässä vähintään 10 lähdemerkintöjen perusteella tarkistettua havaintovuotta ja vähintään 80 % ryhmän oman havaintovälin vuosista. Solutörmäys estää A-luokan.
- B: lähdemerkintöjen perusteella havaintoehdokkaita, mutta sarja on harva tai frekvenssi edellyttää erillistä käsittelyä.
- C: mallin, johdetun arvon, estimaatin tai ennusteen erillinen tarkistus.
- D: solujen, metatietojen tai provenienssin tarkistus ennen laskentaa.
- E: ei numeerista arvoa.
- Hyväksytty havaintoehdokas: observed, julkaistu, äärellinen numero, rivillä HTTP(S)-lähdeosoite ja validation_status joukosta source_verified, source_snapshot_checked, reviewed, validated, pdf_table_visually_checked, official_source_claim_checked. Nämä ovat aiempia tietokantamerkintöjä, eivät tämän auditoinnin uutta lähdevahvistusta.
- Kattavuuskynnys on tämän kartoituksen seulontasääntö, ei yleinen tilastollinen laatustandardi.

## Yhdeksän lohkoa ja ajallinen kattavuus

Lohkojako on alustava nimike- ja teemametatietoihin perustuva luokitus. Jokaisen sarjan sääntö näkyy ledgerissä. Se ei ole empiirinen klusterointi eikä painotus. Saman sarjan ensisijainen lohko on yksikäsitteinen, mutta se ei poista sarjojen keskinäisiä päällekkäisyyksiä.

Jaksoluvut: sarjojen määrä, joilla vähintään yksi sama ryhmä kattaa vähintään 80 % koko jakson vuosista hyväksytyillä havaintoehdokkailla ja joiden frekvenssi on annual. Eri jaksoilla paras ryhmä voi vaihtua. Luvut eivät osoita yhtenäistä koko aikajanan sarjaa tai kansallista kattavuutta.

| Lohko | Sarjoja | A: käyräehdokkaita | 1850–1917 | 1918–1945 | 1946–1975 | 1976–1995 | 1996–2025 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Tuotanto ja työ | 741 | 581 | 0 | 0 | 0 | 256 | 420 |
| Toimeentulo ja jakautuminen | 117 | 32 | 0 | 0 | 0 | 1 | 20 |
| Julkinen talous ja palvelut | 81 | 80 | 0 | 0 | 0 | 0 | 80 |
| Väestö ja toimintakyky | 305 | 135 | 0 | 0 | 0 | 9 | 105 |
| Varallisuus ja rakennettu ympäristö | 82 | 48 | 0 | 0 | 0 | 1 | 20 |
| Ympäristö ja luonnonvarat | 48 | 25 | 0 | 0 | 0 | 0 | 32 |
| Valta, demokratia ja oikeudet | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| Kansalaisyhteiskunta, yhteisöt ja kulttuuri | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| Turvallisuus ja yhteiskuntarauha | 54 | 28 | 13 | 3 | 9 | 10 | 9 |

Luokittelematta jäi 171 sarjaa; niitä ei pakotettu lohkoon.

## Päällekkäisyydet ja puuttuvuus

Täsmälleen samalla sarja–ryhmä–vuosi–periodi-avaimella ylimääräisiä rivejä: 0. Monirivisiä sarja–ryhmä–vuosi-soluja: 0. Numeerisesti tyhjiä soluja: 19774; niitä ei käsitellä nollina.
Samoista yksiköistä ja samoista tallennetuista soluista löytyi 105 identtisen sormenjäljen ryhmää, joissa 264 sarjaa. Tämä on tarkistuslista, ei virheluettelo: esimerkiksi nollasarjat, sektorien vastineet ja samat lähdearvot voivat olla aitoja. Eri ryhmäkoodit voivat myös peittää semanttisen päällekkäisyyden; sormenjälki ei löydä kaikkea.

Alue-, toimiala-, sektori-, ikä- ja sukupuolisarjoja sekä kokonaisuuksia ja niiden osia ei summata ilman määriteltyä ositusta. Koosteen aineistokattavuus erotetaan yhteiskunnan kehityspisteestä.

## Valmiit laskentamallit

| Malli | Perusvuosi | Laskettu jakso | Laskettuja pisteitä |
|---|---:|---|---:|
| age_structure | 1987 | 1987–2024 | 190 |
| age_structure | 1995 | 1995–2024 | 150 |
| age_structure | 2000 | 2000–2024 | 125 |
| age_structure | 2010 | 2010–2024 | 75 |
| production_components | 1975 | 1975–2025 | 153 |
| production_components | 1990 | 1990–2025 | 108 |
| production_components | 2007 | 2007–2025 | 57 |
| real_income_components | 1975 | 1975–2025 | 153 |
| real_income_components | 1990 | 1990–2025 | 108 |
| real_income_components | 2007 | 2007–2025 | 57 |

Pistemäärät sisältävät tekijä- ja ryhmäulottuvuuksia, eivät riippumattomia vuosihavaintoja. Tietokannassa on myös not_computable-rivejä koko aikajanalle: niitä ei saa tulkita lasketuiksi nolliksi. Mallit ovat eri yksiköissä, ja mallimetatiedot kieltävät mallien summan. Niiden laskentatarkistuksia ei ajettu tässä uudelleen.

## Julkisen talouden erityistilanne

Erillisrekisterissä 959638 observed-riviä on merkitty import_checked, 5757 observed-riviä source_verified ja 4079 riviä needs_review. Statusmäärät ja value_kind-määrät ovat eri ulottuvuuksia eikä niitä summata keskenään.

Lähdevarmennettujen havaintojen 80 %:n jaksokynnystä ei ylitä yksikään yksittäinen julkisen talouden sarja tämän tiukan seulonnan mukaan. Tämä ei tarkoita aineiston puuttumista: runsas import_checked-aineisto tarvitsee lähdevarmennuksen sekä yhtenäisen sarjan muodostamisen tarkistuksen. Historialliset valuutat, käyvät ja kiinteät hinnat, yksikkökertoimet, ennakot, budjettiesitykset ja toteumat on erotettava. Lähderyhmäkohtainen ledger sisältää tarkat määrät.

## Epävarmuus ja laadullinen näyttö

Tutkimusrekisterin aktiivisissa johdetuissa arvoissa ei ole täytetty uncertainty_low/uncertainty_high-kenttiä. Tämä ei tarkoita arvojen olevan varmoja. Indikaattoririvien metatiedoista ei löytynyt tämän auditoinnin avainsanahaulla numeeriseen epävarmuuteen viittaavia merkintöjä; sarjatason dokumentaatiossa voi silti olla epävarmuustietoa. Menetelmä-, mittaus-, luokitus- ja kattavuusepävarmuudet pitää arvioida erikseen.

Kaikki 419 mekanismitapausta ovat hypothesis-statuksella; yhdessäkään ei ole numeric_effect-lukua tai causal_effect_identified=true-merkintää. Ne palvelevat selityspolkuja eivätkä ole valmiita numeerisia vaikutuskertoimia. Teemojen kuusivaiheiset scores-kentät ovat toimituksellista jäsennystä, eivät mittaustuloksia.

Simulaatiorekisterin 46 säädös–sarja-yhteyttä on merkitty scenario_assumption. Näistä 40 on merkitty include_in_composite=true. Tätä ei saa tulkita luvaksi käyttää niitä historiallisen kokonaisindeksin varmennettuina vaikutuksina. Nykyiset 12 normalisointisääntöä koskevat omaa pohjoismaista safe_corridor-kokonaisuutta, ja niiden lähtötasot ulottuvat 2025–2050 skenaarioina.

## Suositeltu ensimmäinen laskentamittaristo

1. Tuotanto: production_components ja sen samasta lähdevuosikerrasta sidotut panokset, 1975–2025. Säilytä hajotelman täsmäytys.
2. Toimeentulo: real_income_components, 1975–2025; erikseen ryhmäkohtaiset tulot ja tuloerot. Keskiarvo ei kuvaa kaikkia ryhmiä.
3. Väestö ja työ: age_structure, 1987–2024; elinajanodote ja väestörakenne erillisinä sarjoina.
4. Asuminen, ympäristö, kansalaisosallistuminen ja turvallisuus: valitse lohkolistan ehdokkaista yksittäiset tarkistetut kansalliset ryhmät. Historialliset rikostuomiot eivät ole suoraan tapahtuneen rikollisuuden mittari.
5. Julkinen talous: varmista ensin valitut kansantalouden tilinpidon sarjat, tilinpitokehys, sektorien ositus ja hinta-/valuuttamuunnokset.
6. Älä julkaise yhdeksän lohkon yhteispistettä ennen yhteisten vertailutasojen, painojen, riippuvuuksien ja epävarmuuden herkkyystarkastelua.

## Priorisoidut jatkotoimet

P0: hyväksyttyjen lähdestatusten ja lähteiden alkuperän tarkistus valitulle 15–25 päämittarille; perheiden välisen duplikaation tarkistus.
P0: nimetty kansallinen ryhmä ja vertailukelpoinen määritelmä jokaiselle päämittarille; alue-/toimialasarjojen pää- ja alaluokat.
P0: puuttuvan tiedon ja not_computable-arvojen julkaisusäännöt; ei automaattista interpolointia eikä nollakorvausta.
P1: julkisen talouden valittujen pitkien sarjojen lähde- ja hintaperustan varmennus; tietokannan source_verified-merkintä ei yksin ratkaise määritelmäkatkoksia.
P1: versionhallittu havaintoavain, yhteinen lähdetunniste ja korvausketju. Uusi lähde päivittää samaa havaintoa, ei lisää sen painoa.
P1: epävarmuusmalli, joka erottaa havaintovirheen, lähderiippuvuuden, menetelmävalinnat ja kattavuuden; ristiriita voi kasvattaa epävarmuutta.
P2: 1850–1974 harvojen havaintojen dokumentoidut historialliset vertailupisteet. Yhtenäinen akseli ei edellytä keksittyä vuosikäyrää.
P2: 2026–2050 erilliset skenaariot, joita ei käytetä historiallisten normalisointirajojen uudelleenmäärittelyyn.

## Toistettavuus

SQL-poiminnat ovat scripts/data/readiness-kansiossa. build-readiness.py muodostaa ledgerit ja raportin jäädytetyistä lähdepoiminnoista. compact-inputs.json säilyttää toistamiseen tarvittavat auditoidut sarjatiedot ilman laajoja lähdemetatietoja. Lähdepoimintojen SHA-256-tiivisteet ovat summary.json-tiedostossa. Luokittelu ei muuta lähdearvoja tai nykyisiä kuvaajia.
