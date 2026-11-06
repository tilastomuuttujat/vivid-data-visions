# Alueiden väestötase: syntyvyys, kuolleisuus ja muuttoliike

Täydennys kytketään artikkeleihin **Kenelle kuuluminen kuuluu?** ja **Kun työtä tarvitaan, mutta tekijä ei löydä paikkaansa**. Se kattaa kaikki 19 maakuntaa vuosina 1990–2025 samalla vuoden 2026 aluejaolla. Alkuperäistekstit säilyvät; lähdetäydennys ei hyväksy aiempien aikakausien väitteitä tai osoita kausaalista vaikutusta.

## Vuoden 2025 koko jakauma

| Väestötaseen piirre | Maakuntia |
|---|---:|
| Kuolleita enemmän kuin syntyneitä | 18 / 19 |
| Positiivinen kotimainen nettomuutto | 5 / 19 |
| Positiivinen nettomaahanmuutto | 19 / 19 |
| Kokonaisväkiluku kasvoi | 6 / 19 |
| Kokonaisväkiluku väheni | 13 / 19 |

Nettomaahanmuuton positiivisuus ei siten tarkoita koko väkiluvun kasvua. Samassa maakunnassa voi olla kansainvälistä muuttovoittoa, kotimaista muuttotappiota ja syntyneiden alijäämä. Yhden vuoden jakauma ei kuvaa jokaista vuotta samanlaisena.

Koko maan väkiluku kasvoi vuonna 2025 yhteensä **16 910** henkilöllä. Osat olivat luonnollinen lisäys **−13 377**, nettomaahanmuutto **31 233** ja väkiluvun korjaus **−946**. Kotimaiset nettomuutot kumoutuvat kansallisessa summassa. Korjauserää ei selitetä syntyvyydeksi tai siirtolaisuudeksi.

## Toistettava alueellinen laskenta

StatFin 12dy julkaisee tiedot kunnittain. Kaikki 308 kuntaa koottiin maakunniksi Tilastokeskuksen virallisella **kunta 2026 → maakunta 2026** -avaimella. Maakunnan sisäiset kuntien väliset muutot kumoutuvat nettosummassa. Laskenta tuottaa 684 maakunta-vuotta ja 12 tunnuslukua: syntyneet, kuolleet, luonnollinen lisäys, kotimainen nettomuutto, maahanmuutto, maastamuutto, nettomaahanmuutto, kokonaisnettomuutto, väestönlisäys, korjaus, kokonaismuutos ja väkiluku.

Jokaiselle vuodelle ja alueelle tarkistetaan:

- syntyneet − kuolleet = luonnollinen lisäys;
- maahanmuutto − maastamuutto = nettomaahanmuutto;
- kotimainen nettomuutto + nettomaahanmuutto = kokonaisnettomuutto;
- luonnollinen lisäys + kokonaisnettomuutto + korjaus = kokonaismuutos;
- peräkkäisten vuosien väkilukujen erotus = kokonaismuutos (vuodesta 1991);
- maakuntien jokainen komponentti täsmää saman vuoden kansalliseen lähdesummaan;
- kaikki 684 maakuntien väkilukua täsmäävät myös aiemmin varmennetun väestöpohjan erilliseen 11ra-lähteeseen.

Lähdehaku on jaettu neljään yhdeksän vuoden kyselyyn. Tallennetaan kyselyt, kunkin alkuperäisvastauksen SHA-256, yhdistetyn vastauksen tiiviste sekä virallinen luokitusavain ja sen alkuperäisvastauksen tiiviste. Julkinen aineistotiedosto sisältää niistä lasketut maakunta-arvot, ei koko kuntatason vastausten kopiota.

## Mitä tämä auttaa arvioimaan?

Työn ja kuulumisen artikkeleihin saadaan yhteinen alueellinen mittakaava. Työpaikat, opiskelu, asuminen ja palvelut liittyvät muuttamisen edellytyksiin, mutta tämä väestötase ei tunnista niiden vaikutuksia. Muuttoliike ei myöskään yksin osoita yksinäisyyttä, yhteisöllisyyttä tai palvelujen riittävyyttä.

Muuttotapahtumat eivät ole erillisten muuttajien lukumääriä. Nettomaahanmuutto ei kerro muuttajien kansalaisuutta, syntyperää, koulutusta tai motiivia. Muuttovoitto ja syntyneiden alijäämä ovat kirjanpidollisia komponentteja, eivät muuton syitä. Tietoja ei jatketa vuoteen 2050 eikä nykyistä aluejakoa nimetä historialliseksi aluejaoksi.

Seuraava alueellisen analyysin puute on ikä- ja koulutuskohtainen muuttoliike sekä sen yhdistäminen työpaikkoihin, tuloihin, asumiseen, palveluverkkoon ja kuulumisen kokemuksiin.

## Lähteet ja tarkistaminen

- [Tilastokeskus 12dy](https://pxweb2.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__synt/12dy.px/)
- [Kunnat 2026 ja luokitusavaimet](https://stat.fi/fi/luokitukset/kunta/kunta_1_20260101)
- Maakuntien väkiluvun ristiintarkistus: yhteisen väestöpohjan 11ra.

Aineisto ja alkuperäistiivisteet: `scripts/editorial/sources/population-regions.json`. Keruu ja aggregointi: `python scripts/editorial/collect_population_regions.py`; ei kirjoita tietokantaan. Testit: `python -m unittest discover -s scripts/editorial -p 'test_population_regions.py'`.

Turson `editorial__population_regions` säilyttää yhteisen aineiston, ja kaksi artikkelikytkentää ovat nykyisessä täydennystaulukossa. Tuonti tarkistaa nykyiset artikkelirevisiot ja tekstitiivisteet sekä tallennukset uudella yhteydellä.
