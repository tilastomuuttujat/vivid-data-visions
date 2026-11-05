# Narratiivien päätös- ja lakikytkennät

Ensimmäinen rajattu ketju on toimeentuloturva ja vastuun muutos 1984–2023. Julkiset säädösankkurit ovat tiedostossa `scripts/editorial/legal-anchors.json`; yksityiset artikkelikatkelmat ja niiden kytkennät tallennetaan vain Tursoon. Yhteydet eivät muuta alkuperäisiä artikkeleita, tiivistelmiä tai aiempia aikakausianalyysejä.

## Aineistorakenne

- `editorial__legal_anchors`: versioitu säädösankkuri, alkuperäislähde, valitut pykälät, antamisajankohta, voimaantulo, toimeenpanon rajaus, tavoite ja erikseen lähteistetyt vaikutushavainnot.
- `editorial__article_legal_links`: artikkelin revisio ja tekstitiiviste, lähdekatkelma, narratiivin väite, yhteyden tyyppi, tutkittava mekanismi ja tutkimuskysymys.
- `editorial__narrative_decisions`: yhdistetty hakunäkymä; `is_current=1` osoittaa, että kytkentä vastaa artikkelin nykyistä revisiota. Myöhempi tekstimuutos edellyttää kytkennän uudelleenarviointia.

Suora maininta (`direct_mention`) tarkoittaa, että artikkeli mainitsee kyseisen lain tai historiallisen uudistuksen. Se ei edellytä säädösnumeron esiintymistä tekstissä. Taustoittava kytkentä (`contextual_support`) antaa väitteelle oikeudellisen vertailukohdan ilman väitettä, että artikkeli itse mainitsisi juuri kyseisen lain. Tutkittava mekanismi (`testable_mechanism`) on hypoteesi, ei todettu syy-yhteys. Kaikki artikkeli–säädös-tulkinnat ovat `proposed`-tilassa.

## Ajankohdat ja voimassaolo

Antamispäivä ei ole sama asia kuin eduskunnan hyväksymispäivä. Hyväksymispäivä jätetään NULL-arvoksi, jos sitä ei ole varmennettu. Osalle antamisajankohdista on merkitty vain vuosi. Voimaantulo erotetaan käytännön toteutumisesta: sama päivä voi aloittaa uuden järjestämisvastuun, mutta se ei todista toimeenpanon valmistumista.

Säädösankkurit koskevat alkuperäisten historiallisten säädösten valittuja kohtia. Nykyistä ajantasaista lakia ei käytetä todisteena menneisyyden ehdoista. Vuoden 2015 Kela-siirtopäätökseen tehtiin muutoksia jo ennen vuoden 2017 toimeenpanoa; ankkuri ei ole täydellinen tuolloin sovellettujen sääntöjen kooste. Vuoden 2022 toimeentulotukilain muutos ei yksin perustanut hyvinvointialueita. Vuoden 2001 aktivointisääntelyn alkuperäiset kohderyhmä- ja ikärajat erotetaan myöhemmistä muutoksista.

Tavoitteen peruste (`objective_basis`) erottaa hallituksen esityksen tavoitteen, lain tarkoituspykälän ja toimituksellisen yhteenvedon oikeudellisesta muutoksesta. VTV:n vuoden 2020 tarkastuksen ja vuoden 2023 jälkiseurannan havainnot ovat erillisiä `impact_findings`-tietoja. Muille säädösankkureille vaikutusnäyttö on `not_assessed`; puuttuva arvio ei tarkoita vaikutuksen puuttumista. Positiiviset ja kielteiset Kela-siirron havainnot säilytetään rinnakkain.

## Haku

```sql
SELECT title,act_id,provisions_json,enactment_date,entry_into_force,
       relation_kind,narrative_claim,legal_change,mechanism,research_question,primary_url
FROM editorial__narrative_decisions
WHERE is_current=1
ORDER BY entry_into_force,title;
```

Kytkennät vanhoihin Atlas-päätöksiin tehdään vain sisällöltään vastaaviin pysyviin `d...`-tunnisteisiin. Puuttuvaa vastaavuutta ei korvata lähimmällä vuosiluvulla. Tämän ketjun ulkopuoliset artikkelit ja ennen vuotta 1984 tapahtuneet muutokset jäävät jatkotyöhön; kattavuutta ei väitetä koko sarjalle.

## Toinen ketju: koulutus, työ ja osallistumisen ehdot

`legal-anchors-education-work.json` sisältää vuosina 1987–2021 voimaan tulleita valittuja säädöskohtia. Mukana ovat tasa-arvolaki 609/1986, perusopetuslaki 628/1998, perustuslain 16 §, työsopimuslaki 55/2001, työterveyshuoltolaki 1383/2001, työturvallisuuslaki 738/2002, yhdenvertaisuuslaki 1325/2014 ja oppivelvollisuuslaki 1214/2020. Kyse on kahdeksasta ankkurista, joista yksi täydentää jo mukana olevan perustuslain muita pykäliä. Uusia eri säädöksiä on seitsemän.

Kytkennöissä arvioidaan velvollisuuksien rinnalla myös järjestäjän ja työnantajan vastuuta: opintososiaalisia etuja, työssä suoriutumisen tukemista muutostilanteissa, työn suunnittelua ja kuormitusta sekä kohtuullisia mukautuksia. Työsuhteeseen kuuluvat oikeudet erotetaan työttömien palveluista ja yleisestä oikeudesta toimeentuloon. Työn muokkaus, vammaisuuden perusteella tehtävä kohtuullinen mukautus ja tehtävän olennaisten vaatimusten poistaminen ovat eri asioita.

Tässä erässä ei ole riippumattomia vaikutusarvioita: `impact_status=not_assessed`. Oikeudellinen velvoite ei yksin osoita työolojen, koulutustulosten tai yhdenvertaisuuden parantuneen. Perusopetuslaki 628/1998 ei ole vuosien 1972–1977 uudistuksen alkuperäinen säädös, eikä työterveyshuoltolaki 1383/2001 aloittanut työterveyshuoltoa Suomessa. Näitä myöhempiä lakeja käytetään vanhempaa kehitystä käsittelevissä artikkeleissa vain nimenomaisesti rajattuina vertailuankkureina. Vuosien 1921 ja 1968 alkuperäissäädösten täsmällinen pykäläkytkentä jää erilliseksi täydennykseksi.

Toisen ketjun tuontipaketin `anchor_catalog=education-work` valitsee kiinteästä sallittujen tiedostojen listasta oman ankkuriaineistonsa. Tuonti lisää uuden erän poistamatta ensimmäisen ketjun kytkentöjä. Alkuperäiset artikkelitekstit, tiivistelmät ja aikakausianalyysit säilyvät ennallaan.


## Kolmas ketju: kansalaistoiminta ja julkinen vastuu

Viisi säädösankkuria, 18 kytkentää kuuteen artikkeliin. Yhdistyslaki
503/1989 (tarkoitus, jäsenten päätösvalta ja hallituksen vastuu), perustuslain
731/1999 alkuperäiset osallistumis- ja yhdistymissäännökset, kuntalaki
410/2015, valtionavustuslaki 688/2001 sekä sote-järjestämislaki 612/2021.

Kuntalain yleinen voimaantulo 2015 erotetaan 5 luvun soveltamisen alusta
2017. Perustuslain alkuperäisen 14 §:n osallistumistehtävän momentti on 3,
nykyisessä rakenteessa 4. Valtionavustuslain alkuperäinen 3 § sulki
raha-automaatti-, kasino- ja totopelituottojen avustukset ulkopuolelle: tätä
yleislakia ei käytetä kaikkien historiallisten järjestöavustusten selityksenä.
Sote-järjestämislain voimaantulopykälä on 62 §, ja ajankohta määräytyy
voimaanpanolain 616/2021 perusteella.

Tavoite, oikeudellinen vastuu ja toteutunut vaikutus pidetään erillään.
Yhdistyksen jäsenvalta ei osoita koko väestöryhmän edustavuutta;
kuuleminen ei takaa ehdotuksen hyväksymistä. Vapaaehtoisavun ja
lakisääteisten palvelujen suhde on soveltamisalaltaan rajattu tutkimuskysymys.
Kaikki kytkennät ovat ehdotuksia (`proposed`); vaikutusnäyttöä ei ole lisätty.
Alkuperäiset artikkelit ja aikaisempien ketjujen tiedot säilytetään.

## Suora yhteys Turson lakikarttaan

`legal_map.py` yhdistää Turson `lakikartta__statute_catalog`-luettelon
säädösnumeron ja vuoden artikkelien voimassa oleviin säädösankkureihin.
Atlas-tunniste `d...` on eri tunnisteavaruus eikä sitä käytetä Turson säädösavaimena.
Otsikkosamankaltaisuus, sama aihe tai seuraajasäädös eivät muodosta täsmäosumaa.
Päällekkäinen numero/vuosi luettelossa keskeyttää tallennuksen.

- `editorial__lakikartta_links`: täsmäosuma tai `unmatched`, luettelon oma avain.
- `editorial__article_lakikartta`: kaikki artikkelikytkennät ja karttavastineet,
  myös puuttuvat ja vanhentuneet artikkeliversiot näkyvällä `is_current`-lipulla.
- `lakikartta__article_connections`: käänteinen haku säädöksestä nykyisten
  artikkelien täsmällisiin säädöskytkentöihin.
- `editorial__lakikartta_unmatched`: luettelosta puuttuvat vastineet, joita ei
  korvata arvatulla taustayhteydellä eikä keksityllä päätöstietueella.

```sql
SELECT title,provisions_json,article_evidence,mechanism,research_question
FROM lakikartta__article_connections WHERE lakikartta_statute_id = ?;

SELECT act_id,lakikartta_statute_id,lakikartta_match_status,is_current
FROM editorial__article_lakikartta WHERE article_id = ?;
```

Arviointitapausten ja historiallisten tapahtumien lukumäärät osoittavat vain
samaan säädöstietueeseen liittyvän aineiston olemassaolon, eivät vaikutusnäyttöä.
Artikkelikohtaisen suhteen tulkintatyyppi ja ehdotusstatus säilyvät näkyvissä.
Tavoitteita, lähdeaineistoja tai alkuperäisiä artikkelikytkentöjä ei muuteta.

Päivitys tehdään luotetussa Actions-ajossa tehtävällä `operation: legal-map`.
Se käyttää olemassa olevaa Turso-salaisuutta, tarkistaa lähteiden säilymisen
ja varmistaa liitokset uudella tietokantayhteydellä. Uusien artikkelien
lakikytkentöjen tai säädösluettelon muutosten jälkeen tämä ajo uusitaan.
Näkymät ovat tietokantakerros; käyttöliittymä ei vielä avaa niiden sisältöä.


### Tunnisteiden täydennys, menetelmä v2

Luettelon erillinen `number`-kenttä voi puuttua, vaikka natiivi `id` on
täsmällinen `vuosi/numero` (esim. `1986/609`). Menetelmä v2 tunnistaa
myös tämän muodon, vertaa sitä olemassa oleviin numero- ja vuosikenttiin
ja hylkää ristiriidat. Ei-numeerisia historiallisia tapahtumatunnisteita
ei muunnettaisi säädösnumeroiksi. `identity_basis` kertoo näkymässä,
perustuuko osuma numero–vuosi-kenttiin vai natiiviin tunnisteeseen.
Tämä ei lisää säädösluettelon rivejä tai muuta niiden alkuperäisiä kenttiä.


### Kuuden puuttuvan säädösidentiteetin täydentäminen

`lakikartta-catalog-additions.json` sisältää Finlexistä tarkistetut otsikot ja
tunnisteet: 969/1995, 1412/1997, 189/2001, 738/2002, 815/2015 ja 1023/2022.
`catalog_completion.py` lisää puuttuvat identiteetit Turson säädösluetteloon
ylikirjoittamatta olemassa olevia rivejä tai laskettuja mittareita.
Muutoslain ja pääsäädöksen ero sekä muutettavan säädöksen viitetunniste
tallennetaan lähdemetadatassa `editorial__catalog_additions`-tauluun.
Tämä vanhempaa lakia koskeva viite ei luo automaattista verkoston kaarta.

Uusiin luetteloriveihin tallennetaan vain avain, olemassa olevan siirtomuodon mukainen `_migration_key`, otsikko, säädösnumero, vuosi
ja lähdeversio. Voimassaolotila ja verkostomittarit jäävät NULL-arvoiksi.
Alkuperäinen täysi lähdeaineisto ja artikkelitekstit säilyvät ennallaan.
Uudelleenajo ei tee kaksoiskappaleita; ristiriitainen olemassa oleva nimi
tai tunniste keskeyttää täydennyksen ja peruuttaa lisäykset.

Luotettu Actions-tehtävä `operation: legal-map-complete` tarkistaa ja
tallentaa luettelolisäykset, varmentaa ne uudella yhteydellä ja päivittää
sen jälkeen kaksisuuntaiset artikkeliliitokset. Tämä täydentää nykyisen
artikkelikytkentäerän, ei kaikkia lakikartan puuttuvia historiallisiä säädöksiä.
