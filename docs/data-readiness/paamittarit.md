# Hyväksytty päämittaristo, versio 1 — 26.10.2026

Hyväksytty 18 mittaria kuvailevaan tarkasteluun: nimetyt sarjat, ryhmät, ajanjaksot ja lähteet. Hyväksyntä ei koske kokonaisindeksin painoja, normalisointia tai syyvaikutuksia. Havaintopisteet on jäädytetty koneelliseen rekisteriin; uusia vuosia ei hyväksytä automaattisesti.

| Mittari | Lohko | Tallennetut hyväksytyt vuodet | Pisteitä | Tarkistuksen peruste |
|---|---:|---|---:|---|
| Tuotannon reaalinen määrä asukasta kohden | 1 | 1860–2025 | 166 | existing_source_checked_snapshot_with_definition_review |
| 15–64-vuotiaiden työllisyysaste | 1 | 2010–2025 | 11 | existing_source_checked_snapshot_with_definition_review |
| 15–74-vuotiaiden työttömyysaste | 1 | 2010–2025 | 16 | existing_source_checked_snapshot_with_definition_review |
| Kotitalouksien reaalinen käytettävissä oleva nettotulo asukasta kohti | 2 | 1975–2025 | 51 | stored_inputs_recomputed |
| Käytettävissä olevien rahatulojen Gini | 2 | 1995–2024 | 3 | existing_source_checked_snapshot_with_definition_review |
| Julkisyhteisöjen sulautettu bruttovelka / BKT | 3 | 1995–2024 | 30 | existing_source_checked_snapshot_with_definition_review |
| Julkisyhteisöjen kokonaismenot / BKT | 3 | 1995–2023 | 29 | existing_source_checked_snapshot_with_definition_review |
| Vastasyntyneen elinajanodote, miehet | 4 | 1851–2025 | 70 | fresh_source_cell_comparison |
| Vastasyntyneen elinajanodote, naiset | 4 | 1851–2025 | 70 | fresh_source_cell_comparison |
| Imeväiskuolleisuus, kaikki sukupuolet | 4 | 1850–2025 | 176 | fresh_source_cell_comparison |
| Kokonaishedelmällisyysluku | 4 | 1950–2024 | 43 | existing_source_checked_snapshot_with_definition_review |
| Ahtaasti asuvien henkilöiden osuus | 5 | 1990–2024 | 8 | existing_source_checked_snapshot_with_definition_review |
| Yksinelävät asunnottomat, kuntakysely | 5 | 1987–2025 | 39 | existing_source_checked_snapshot_with_definition_review |
| Kasvihuonekaasupäästöt ilman maankäyttösektoria | 6 | 1990–2023 | 25 | existing_source_checked_snapshot_with_definition_review |
| Energian kokonaiskulutus | 6 | 2021–2024 | 4 | existing_source_checked_snapshot_with_definition_review |
| Eduskuntavaalien äänestysaktiivisuus, vuosikirjan nimittäjä | 7 | 1951–2023 | 20 | existing_source_checked_snapshot_with_definition_review |
| Kuntavaalien äänestysaktiivisuus | 7 | 1950–2025 | 20 | existing_source_checked_snapshot_with_definition_review |
| Vankimäärä 31.12., kaikki lähteen vangit | 9 | 1850–2022 | 173 | existing_source_checked_snapshot_with_definition_review |

Vuosiväli ei tarkoita aukotonta vuosittaista kattavuutta. Elinajanodotteen ennen vuotta 1971 julkaistut pisteet ovat monivuotisia jaksoja. Gini-sarjassa on vain kolme havaintoa; energiasarjassa neljä. Vaalisarjat piirretään vaalivuosiin. Käyrä ei ylitä määritelmäkatkoksia jatkuvana viivana.

## Hyväksynnän tarkistukset

- Miesten ja naisten elinajanodote sekä imeväiskuolleisuus haettiin 26.10.2026 uudelleen StatFinin 12am- ja 12aq-rajapinnoista. Kaikki 435 tietokantaan tallennettua arvoa täsmäsivät; hyväksyntään otetaan vain vuodet 1850–2025. Raakavastaukset ja SHA-256-tiivisteet säilytetään.
- Reaalisen käytettävissä olevan nettotulon 51 vuosiarvoa laskettiin uudelleen tallennetuista kansallisista lähdekopioista. Suurin ero oli 0 euroa/asukas. Lähdekopioita ei tällä laskentatarkistuksella koroteta uudelleen lähteestä varmennetuiksi.
- Muut hyväksynnät perustuvat olemassa olevaan source_verified/source_snapshot_checked-näyttöön sekä määritelmien, yksikön, ryhmän, aukkojen ja rajoitusten tarkistukseen. Kaikkia niiden lukuja ei haettu uudelleen alkuperäislähteestä.

## Mittarikohtaiset rajat

### Tuotannon reaalinen määrä asukasta kohden

Sarja: `fi.statfin15ai.total.b1gmh.b60cef008d`. Ryhmä: `FI`. Yksikkö: Per capita, volyymi-indeksi (1926=100).

ei suoraan hyvinvointia; historiallinen rekonstruktio ja tilinpitokatkokset 1960/1975; vuosikerta säilytetään

[Lähde](https://pxdata.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__ntp/15ai.px/)

### 15–64-vuotiaiden työllisyysaste

Sarja: `fi.histlabour.lfs2021.employment_rate_15_64`. Ryhmä: `FI_HIST`. Yksikkö: %.

Vuoden 2021 menetelmä; vain tallennetut vuodet, ei ketjutusta aiempaan menetelmään. Vuoden 2025 työllisten lukumäärän lähderistiriitaa ei ratkaista tällä prosenttisarjalla.

[Lähde](https://otos.stat.fi/bitstreams/52e5ce2a-0e40-4698-92ce-b4a6650c1495/download)

### 15–74-vuotiaiden työttömyysaste

Sarja: `fi.histlabour.lfs2021.unemployment_rate`. Ryhmä: `FI_HIST`. Yksikkö: %.

Nimittäjänä työvoima; ei työllisyysasteen komplementti. Vuoden 2021 menetelmä.

[Lähde](https://otos.stat.fi/bitstreams/52e5ce2a-0e40-4698-92ce-b4a6650c1495/download)

### Kotitalouksien reaalinen käytettävissä oleva nettotulo asukasta kohti

Sarja: `fi.atlas1960.household_disposable_real_per_capita`. Ryhmä: `FI`. Yksikkö: euroa / asukas, vuoden 2025 rahassa.

S14-keskiarvo ei mediaani eikä jakauma. Vuoden 2025 hintataso; 2024–2025 ennakollisuus säilytetään.

[Lähde](https://pxdata.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__ntp/15ac.px/)

### Käytettävissä olevien rahatulojen Gini

Sarja: `fi.distribution.gini2025.disposable`. Ryhmä: `FI`. Yksikkö: Gini 0–100.

Vain kolme tallennettua havaintopistettä tässä lähdeversiossa; älä ketjuta toista Gini-vuosikertaa automaattisesti. Ei varallisuuserojen mittari.

[Lähde](https://stat.fi/fi/julkaisu/cmiph37ob7neg07uprcknu1jv)

### Julkisyhteisöjen sulautettu bruttovelka / BKT

Sarja: `indicator_import.valtionvelka_bktsta`. Ryhmä: `FI`. Yksikkö: % BKT:sta.

Ei valtionvelka, vaikka alkuperäinen avain on valtionvelka_bktsta. Brutto- ja nettovelka erotettava. Ei yksiselitteistä hyvää suuntaa.

[Lähde](https://pxweb.nordicstatistics.org/api/v1/en/Nordic%20Statistics/Public%20finance/Government%20deficit%20and%20debt/PUBS14.px)

### Julkisyhteisöjen kokonaismenot / BKT

Sarja: `indicator_import.julkiset_menot_bktsta`. Ryhmä: `FI`. Yksikkö: % BKT:sta.

Menojen osuus ei palvelujen laatu tai vaikuttavuus; ei yksiselitteistä hyvää suuntaa. Sama BKT-nimittäjä velkasuhteen kanssa.

[Lähde](https://pxweb.nordicstatistics.org/api/v1/en/Nordic%20Statistics/Public%20finance/Public%20expenditure/PUBS13.px)

### Vastasyntyneen elinajanodote, miehet

Sarja: `statfin.12am.v20261019.eodote_0.sex1`. Ryhmä: `FI`. Yksikkö: vuotta.

Periodielinajanodote, ei syntymäkohortin toteutunut elinikä. Ennen vuotta 1971 lähteen monivuotiset jaksot, ei yksittäisiä vuosihavaintoja.

[Lähde](https://statfin.stat.fi/PxWeb/api/v1/fi/StatFin/kuol/12am.px)

### Vastasyntyneen elinajanodote, naiset

Sarja: `statfin.12am.v20261019.eodote_0.sex2`. Ryhmä: `FI`. Yksikkö: vuotta.

Sama periodikäsitteen rajoitus kuin miehillä. Sukupuolisarjoista ei lasketa koko väestön lukua ilman oikeaa menetelmää.

[Lähde](https://statfin.stat.fi/PxWeb/api/v1/fi/StatFin/kuol/12am.px)

### Imeväiskuolleisuus, kaikki sukupuolet

Sarja: `statfin.12aq.v20261019.imr.sexSSS`. Ryhmä: `FI`. Yksikkö: promillea.

Alle yksivuotiaiden kuolemat suhteessa elävänä syntyneisiin. Ei kuolleiden määrä eikä promilleosuus koko väestöstä. Historiallinen tilastokattavuus huomioitava.

[Lähde](https://statfin.stat.fi/PxWeb/api/v1/fi/StatFin/kuol/12aq.px)

### Kokonaishedelmällisyysluku

Sarja: `indicator_import.syntyvyys_tfr`. Ryhmä: `FI`. Yksikkö: lasta naista kohden.

Periodimittari ei toteutunut lopullinen lapsiluku eikä yhteiskunnan onnistumispiste. Puuttuvat vuodet säilyvät.

[Lähde](https://pxweb.nordicstatistics.org/api/v1/en/Nordic%20Statistics/Demography/Fertility/CHIL02.px)

### Ahtaasti asuvien henkilöiden osuus

Sarja: `fi.followup20261021.housing_overcrowded_person_share`. Ryhmä: `total`. Yksikkö: %.

Enemmän kuin yksi henkilö huonetta kohti, keittiö pois lukien. Ei asuntokuntien osuus. Harvat julkaistut vertailuvuodet.

[Lähde](https://otos.stat.fi/server/api/core/bitstreams/fb1297b1-1607-4ea2-b303-8f993b9c5daa/content)

### Yksinelävät asunnottomat, kuntakysely

Sarja: `housing.homeless_single_1987_2025`. Ryhmä: `FI`. Yksikkö: henkilöä.

Manner-Suomi; yleensä 15.11. poikkileikkaus ja vaihtuva vastauskattavuus. Helsingin tilastointikatkos 2018: ei vertailua tai jatkuvaa viivaa katkoksen yli. Ei koko asunnottomuuden määrä.

[Lähde](https://www.varke.fi/fi/document/asunnottomat-2024)

### Kasvihuonekaasupäästöt ilman maankäyttösektoria

Sarja: `fi.followup20261021.ghg_excl_lulucf`. Ryhmä: `total`. Yksikkö: miljoonaa tonnia CO₂-ekv..

Sama vuoden 2025 inventaarioversio; 1991–1999 puuttuvat. Ei kulutusperusteinen hiilijalanjälki eikä kaikkien ympäristövaikutusten summa.

[Lähde](https://otos.stat.fi/server/api/core/bitstreams/fb1297b1-1607-4ea2-b303-8f993b9c5daa/content)

### Energian kokonaiskulutus

Sarja: `fi.followup20261021.energy_total`. Ryhmä: `total`. Yksikkö: TJ.

Neljä vertailuvuotta 2021–2024, 2024 ennakkotieto. Primäärienergia TJ, ei sähköntuotanto. Suunta ei yksiselitteisesti hyvä/huono.

[Lähde](https://otos.stat.fi/server/api/core/bitstreams/fb1297b1-1607-4ea2-b303-8f993b9c5daa/content)

### Eduskuntavaalien äänestysaktiivisuus, vuosikirjan nimittäjä

Sarja: `fi.followup20261021.turnout_parliament`. Ryhmä: `total`. Yksikkö: %.

Vain vaalivuodet; nimittäjäkatkos 1975 (ulkomailla asuvat mukana). Älä ketjuta Suomessa asuvien sarjaan. Ei demokratian kokonaisindeksi.

[Lähde](https://otos.stat.fi/server/api/core/bitstreams/fb1297b1-1607-4ea2-b303-8f993b9c5daa/content)

### Kuntavaalien äänestysaktiivisuus

Sarja: `fi.followup20261021.turnout_municipal`. Ryhmä: `total`. Yksikkö: %.

Vain vaalivuodet; äänioikeuden ehdot ja äänioikeutettujen joukko muuttuneet. Ei samojen yksilöiden osallistumispolku.

[Lähde](https://otos.stat.fi/server/api/core/bitstreams/fb1297b1-1607-4ea2-b303-8f993b9c5daa/content)

### Vankimäärä 31.12., kaikki lähteen vangit

Sarja: `crime.hcs.fi.prison_all_dec31`. Ryhmä: `FI`. Yksikkö: lukumäärä.

Kontrollijärjestelmän varanto, ei rikollisuusaste tai turvallisuuden paraneminen. Ei väestöön suhteutettu; ei kaikkien leirien ja sotavankien kokonaismäärä.

[Lähde](https://criminalstatistics.fi/finland-sentences-and-prisons/)

## Pois hyväksynnästä

Luottamus eduskuntaan ja sosiaalinen luottamus jätettiin pois. Molemmissa ESS-sarjoissa on publication_hold ja painotettujen keskiarvojen toistamisvaatimus. reviewed-merkintä tai aiemman seulonnan B-luokka ei ohita tätä. Kansalaisyhteiskunnan lohkoon ei keksitä korvaavaa pistettä.

## Koostaminen ja tietojen täydentyminen

- Hyväksytyt mittarit eivät ole 18 toisistaan riippumatonta yhteiskuntavaikutusta. Miesten ja naisten elinajanodote kuuluu samaan riippuvuusklusteriin; samoin työllisyys/työttömyys ja julkisen talouden suhdeluvut.
- Kokonaisindeksin painot ja normalisointi ovat null; composite_approved=false. Erityisesti kokonaishedelmällisyydelle, energiankulutukselle, meno- tai velkasuhteelle ja vankiluvulle ei anneta automaattista hyvää/huonoa suuntaa.
- Uusi lähde täydentää samaa havaintopaikkaa. Sama ilmiö ei saa lisäpainoa lähteiden lukumäärästä.
- Riviarvon, ryhmän tai lähdeversion muutos käynnistää hyväksynnän tarkistuksen. Muutos säilyy versiona; vanhoja hyväksyttyjä soluja ei korvata hiljaisesti.
- Puuttuvat arvot ja havaintojen väliin jäävät vuodet eivät ole nollia. Vuosien 2026–2050 skenaariot hyväksytään myöhemmin erikseen.

Koneellinen rekisteri: approved-main-metrics.json. Toistettava hyväksyntämoottori ja lähdepoiminnat: scripts/data/readiness/approve-main-metrics.py.
