# Väestöstä työllisyyteen ja tehtyyn työpanokseen

Tämä vaihe hyödyntää kahta Atlasissa jo käytössä olevaa Tilastokeskuksen aineistoa. Niiden alkuperäiset API-vastaukset haettiin uudelleen 6.11.2026 ja kaikki käytetyt lähdesolut verrattiin olemassa oleviin syötteisiin. Atlasin kuvaajia tai niiden laskentaa ei muuteta. Työn ja julkisen talouden artikkeleihin lisätään erilliset, versioidut tulkinnat lähteineen.

## Eri kysymyksiin eri mittarit

- **Väestöpohja:** ikäryhmien henkilömäärä; ei työllisten tai työkykyisten määrä.
- **115w, työssäkäyntitilasto:** maassa vakituisesti asuvien rekisteripohjainen pääasiallinen toiminta vuoden lopussa; kaikki iät, 1987–2024. Koko väestön työllisten osuus ei ole tavallinen työikäisten työllisyysaste eikä työvoimatutkimuksen mittari.
- **15ai, kansantalouden tilinpito:** vuoden kotimainen työllisyys, vuotuiset työtunnit ja keskiväkiluku, tässä 1975–2025. Vuosi 2025 on ennakollinen. Päävertailu päättyy yhteiseen vuoteen 2024.

| Tilinpidon mittari | 1990 | 2024 |
|---|---:|---:|
| Kotimaiset työlliset, tuhatta | 2 468 | 2 748 |
| Vuotuiset työtunnit, miljoonaa | 4 262 | 4 252 |
| Työtunnit / työllinen | 1 726,9 | 1 547,3 |
| Työtunnit / asukas (keskiväkiluku) | 854,8 | 756,4 |

Tämä on kahden päätevuoden vertailu. Työllisten määrä kasvoi, mutta kokonaisvuosityöpanos pysyi lähes samana. Työajan pituus, osa-aikaisuus, poissaolot, suhdanne ja toimialarakenne voivat vaikuttaa: niiden osuuksia tämä laskelma ei tunnista. Tunnit eivät mittaa palkatonta työtä, työn laatua, työkykyä tai palkkoja. Tuottavuus, veropohja tai julkiset menot eivät seuraa tuntimäärästä yksin.

## Ikärakenteen laskennallinen vertailu

115w:n työllisten osuus **koko väestöstä** oli 46,7 % vuonna 1990 ja 43,0 % vuonna 2024. Vuoden 2024 ikäryhmäkohtaisilla työllisyysosuuksilla ja vuoden **1990 kiinteillä väestöpainoilla** saadaan 46,4 %. Toteuman ja vertailuluvun erotus on −3,4 prosenttiyksikköä.

Laskenta: kunkin vuoden ikäryhmän työlliset jaetaan saman ryhmän väestöllä. Nämä osuudet painotetaan vuoden 1990 koko väestön ikäjakaumalla. Ryhmät ovat lähteen 0–17, 18–24, viisivuotisryhmät 25–74 sekä 75 vuotta täyttäneet. Kaikkien ryhmien väestö- ja työllissummat täsmäävät lähteen kokonaislukuihin jokaisena vuonna.

Toistettava identiteetti:

`toteuma(t) − toteuma(1990) = [vakioitu(t) − toteuma(1990)] + [toteuma(t) − vakioitu(t)]`

Tämä on laskennallinen jako samalla tilastolla, ei kausaalinen vaikutusarvio tai ennuste siitä, millainen Suomi olisi ilman ikääntymistä. Vuosi 1990 oli lamaa edeltävä vertailuvuosi; se ei ole neutraali trendiperusta. Vuoden 2005 rekisteriluokituksen muutos, ikärajojen määritelmät ja karkeiden ikäryhmien sisäinen rakennemuutos rajoittavat tulkintaa. Ikäryhmän työllisyysosuuden muutos ei osoita tietyn uudistuksen vaikutusta.

## Artikkelikytkennät

**Työ:** 15–64-vuotiaiden määrän kasvu ei takaa tehtyjen tuntien kasvua. Osaamisen, tehtävien, työkyvyn ja työajan yhteensopivuus säilyy olennaisena tutkimuskysymyksenä. Täydennys ei todista kohtaanto-ongelman syytä.

**Julkinen talous:** väestöllisen huoltosuhteen rinnalle tarvitaan toteutuva työllisyys, työaika ja tuottavuus. Verosäännöt, tulonjako, verotettavat tulot ja ikäryhmittäiset menot puuttuvat vielä tästä laskelmasta. Ikävakioitu vertailuluku ei ole kestävyysvaje eikä perustelu tietylle sopeutustoimelle.

Alkuperäiset artikkelitekstit ja lähdesarjat säilyvät. Työllisyysrekisterin henkilömäärää ei pakoteta vastaamaan tilinpidon vuotuista kotimaista työllisyyttä, eikä tilinpidon keskiväkilukua korvata vuoden lopun väkiluvulla. Vuoteen 2050 ei jatketa näitä työpanossarjoja laskennallisella suoralla.

## Lähteet ja toistaminen

- [Tilastokeskus 115w](https://pxdata.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__tyokay/115w.px/)
- [Tilastokeskus 15ai](https://pxweb2.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__ntp/15ai.px/)
- [Työssäkäyntitilaston menetelmä](https://guides.stat.fi/tyoelama-tilastoina/tyoelaman-tilastointi)

Lähdevastaukset, kyselyt, keruuajat ja tiivisteet: `scripts/editorial/sources/population-work/`. Keruu: `python scripts/editorial/collect_population_work.py`; se ei kirjoita tietokantaan. Muuttunut lähde estää vanhan version käytön, kunnes lähde- ja artikkeliversiot on arvioitu uudelleen. Tarkistukset: `python -m unittest discover -s scripts/editorial -p 'test_population_work.py'`.

Turson `editorial__population_work` säilyttää kaksi yhteistä tarkistettua lähdekuvaa. Artikkelikohtaiset lisäykset ovat nykyisessä `editorial__article_evidence_supplements`-taulussa. Tuonti tarkistaa nykyiset revisiot ja tekstitiivisteet sekä vertaa tallennuksia uudella tietokantayhteydellä.
