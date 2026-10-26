# Gapminder-täydennys Suomelle vuodesta 1850

Neljä ilmiötä, viisi sarjaesitystä. Aineistot poimittu yksilöidyistä Git-commiteista. Alkuperäisiä kansallisia sarjoja ei korvata. Kaikki tuodut luvut ovat arvioita tai ennusteita, eivät uusia havaittuja vuosihavaintoja.

| Sarja | Tallennettu jakso | Rivejä | Julkaistava historiallinen osa |
|---|---|---:|---|
| Alle viisivuotiaiden kuoleman todennäköisyys, Gapminder | 1850–2025 | 176 | 1850–2018, 169 arvoa |
| Äitiyskuolleisuussuhde, Gapminder | 1850–2013 | 135 | 1850–2013, 135 arvoa |
| Kokonaishedelmällisyysluku, Gapminder v15 | 1850–2025 | 176 | 1850–2023, 174 arvoa |
| Alueperusteiset CO₂-päästöt, Gapminder | 1850–2021 | 172 | 1850–2021, 172 arvoa |
| Alueperusteiset CO₂-päästöt asukasta kohti, Gapminder | 1850–2021 | 172 | 1850–2021, 172 arvoa |

Vuosiväli ei takaa kaikkien vuosien kattavuutta; äitiyskuolleisuuden puuttuvat lähdevuodet säilyvät puuttuvina.

## Laaturajat

- Lapsikuolleisuuden repo on v12, mutta julkinen menetelmäsivu kuvaa v11:tä. Vuodet 2019–2025 tallennetaan erillisin tilamerkinnöin ja jätetään julkaistavan historiallisen osan ulkopuolelle. Vuodet 2023–2025 ovat lähteen vuoden 2022 julkaisusta katsottuna tulevaisuutta ja merkitään ennusteiksi.
- Hedelmällisyys v15: 2024–2025 ovat YK:n keskivariantin ennusteita. Niitä ei käytetä havaittuina toteumina.
- Historialliset arviot, lähteiden yhdistäminen ja tasoitus voivat muuttaa murroskohtien näkyvyyttä. Tämän tuonnin täsmällinen kopiointi ei varmista alkuperäisten tutkimusten kaikkia lukuja.
- CO₂-metatiedoissa lukee MtCO₂ ja MtCO₂/asukas, mutta tiedoston luvut vastaavat tonneja ja tonneja/asukas. Raakaluvut säilytettiin muuttamatta. Mittakaavan tarkistus GCB2022:n Suomen vuoden 2021 arvoon: muunnos MtC → tCO₂ kertoimella 3 664 000; Gapminder/reference-suhde on 0.994541. Eri vuosikerrat eivät ole numeerisesti identtisiä: tarkistus koskee mittakaavaa eikä väitettä täsmällisestä lähdeversiosta. Alkuperäinen ristiriitainen metadata säilyy.
- Kokonaispäästöt ja päästöt asukasta kohti kuuluvat samaan riippuvuusklusteriin. Niitä ei summata erillisiksi yhteiskuntavaikutuksiksi. Kumulatiivinen Fast Track -sarja jätettiin pois, koska sen metadata kertoo kulutusperusteisesta kertymästä.
- Tuonti ei tee uusia interpolointeja, yksikkömuunnoksia tai vuosien 2026–2050 ekstrapolointia. Lähteen tulevaisuussolut säilyvät alkuperäisessä maapoiminnassa, mutta niitä ei tuoda tähän 1850–2025-erään.
- Ei kokonaisindeksin painoja eikä vahvistettuja syyvaikutuksia. Epävarmuusvälejä ei keksitä.

## Lähteet

- [Alle viisivuotiaiden kuoleman todennäköisyys, Gapminder](https://raw.githubusercontent.com/open-numbers/ddf--gapminder--fasttrack/dee8978535ee563526704d2793497f8537280469/countries_etc_datapoints/ddf--datapoints--child_mortality_0_5_year_olds_dying_per_1000_born--by--country--time.csv) — [menetelmä](https://www.gapminder.org/data/documentation/gd005/)

- [Äitiyskuolleisuussuhde, Gapminder](https://raw.githubusercontent.com/open-numbers/ddf--gapminder--systema_globalis/ee190605fdec9d1c35c38e18e869a400a5818fe6/countries-etc-datapoints/ddf--datapoints--maternal_mortality_ratio_per_100000_live_births--by--geo--time.csv) — [menetelmä](https://www.gapminder.org/data/documentation/gd010/)

- [Kokonaishedelmällisyysluku, Gapminder v15](https://raw.githubusercontent.com/open-numbers/ddf--gapminder--fasttrack/dee8978535ee563526704d2793497f8537280469/countries_etc_datapoints/ddf--datapoints--children_per_woman_total_fertility--by--country--time.csv) — [menetelmä](https://www.gapminder.org/data/documentation/gd008/)

- [Alueperusteiset CO₂-päästöt, Gapminder](https://raw.githubusercontent.com/open-numbers/ddf--gapminder--fasttrack/dee8978535ee563526704d2793497f8537280469/countries_etc_datapoints/ddf--datapoints--co2_terr--by--country--time.csv) — [menetelmä](https://gapm.io/dco2_territorial_historic)

- [Alueperusteiset CO₂-päästöt asukasta kohti, Gapminder](https://raw.githubusercontent.com/open-numbers/ddf--gapminder--fasttrack/dee8978535ee563526704d2793497f8537280469/countries_etc_datapoints/ddf--datapoints--co2_pcap_terr--by--country--time.csv) — [menetelmä](https://gapm.io/dco2_territorial_historic)

Lisäykset ovat indicator_series- ja indicator_values-tauluissa, teemakontekstiyhteydet atlas_variable_indicators-taulussa. Erän manifesti ja erillinen historiallisen rekisterin täydennys ovat dataset_meta-taulussa. Vanhat 18 päämittarin ja 536 historiallisen sarjan rekisterit säilyvät jäädytettyinä; uusi täydennys linkittää niihin.

Toistettavuus: build-batch.py tuottaa batch.json:n samoista Suomen CSV-poiminnoista. fetch-sources.py hakee poiminnat vain kiinnitetyistä lähdecommiteista ja tarkistaa lähteen Git-blobin, kun tunniste on manifestissa. import.sql hylkää muuttuneen erän, eikä identtinen uusintatuonti lisää rivejä. Staattisia verkkonäkymäpoimintoja ei päivitetä tässä erässä.

## Toteutuksen tarkistus

Tallennettu Supabaseen 26.10.2026: 5 sarjaa, 831 vuosiarvoa, joista 822 julkaistavaa ja 9 pidätettyä. Viisi kontekstiyhteyttä. Sama tuonti suoritettiin uudelleen: rivimäärät säilyivät samoina. Tarkistuskyselyssä ei havaittuja arvoja, julkaistuja ennusteita eikä jakson ulkopuolisia vuosia. Neljä automaattista lähde-, rajaus-, yksikkö- ja manifestitestiä läpäisty.
