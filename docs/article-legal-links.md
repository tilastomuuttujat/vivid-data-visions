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

## Neljäs ketju: oikeusturva, tiedonsaanti ja perustelut

`legal-anchors-justice.json`: neljä säädösankkuria ja 16 kytkentää seitsemään
artikkeliin. Perustuslain 2, 12, 21 ja 22 §:n oikeudellinen kehys erotetaan
hallintomenettelyn, asiakirjatiedonsaannin ja oikeusavun konkreettisista ehdoista.
Hallintolain alkuperäinen versio 434/2003 tulee voimaan 1.1.2004;
julkisuuslaki 621/1999 1.12.1999 ja oikeusapulaki 257/2002 1.6.2002.
Voimaantuloa ei tulkita oikeusturvan, julkisuuden tai oikeusavun syntyhetkeksi.

Hallintolaki ei ole yleinen laki kaikesta lainvalmistelusta tai poliittisesta
keskustelusta eikä tuomioistuinten lainkäytöstä. Asianosaisen kuuleminen,
muiden vaikuttamismahdollisuus ja yleinen poliittinen osallistuminen erotetaan.
Julkisuuslain 3 §:n alkuperäistä tiedonhallintatapaa ei sekoiteta vuoden 2019
sanamuotoon. Asiakirjan saatavuus ei tarkoita sen sisällön oikeellisuuden
varmistamista. Oikeusavun tarveharkinta ja kustannusrajoitukset eivät katoa
pelkällä lain olemassaololla. Kaikki kytkennät ovat edelleen `proposed`,
eikä uusia empiirisiä vaikutustuloksia ole lisätty.

`legal-import` päivittää nyt myös suoran lakikarttaliitoksen ja varmentaa sen
uudella yhteydellä. Artikkelien alkuperäiset tekstit ja tiivistelmät säilyvät.

Oikeusapulain 257/2002 puuttuva luetteloidentiteetti täydennetään erillisestä
`lakikartta-justice-additions.json`-lähde-erästä. Sen oma lähdeversio säilyttää
aiemman kuuden säädöksen täydennyksen provenienssin muuttumattomana.
`legal-map-complete`-tehtävän `catalog: justice` valitsee tämän rajatun erän;
ulkopuolista tiedostopolkua ei voi antaa tehtävän kautta.

## Viides ketju: kuluttaja, kilpailu ja omistuksen päätösvalta

Neljä ankkuria, 13 kytkentää viiteen artikkeliin. Kuluttajansuojalain
38/1978 sopimussuojan perusta erotetaan muutoslain 561/2008 tiedonantoa
ja menettelyjä koskevista säännöistä. Alkuperäistä lakia ei tulkita vuoden
2025 digipalvelujen täydelliseksi oikeusperustaksi. Muutoslaki on oma
säädösidentiteettinsä eikä 38/1978:n vaihtoehtoinen tunniste.

Kilpailulain 948/2011 valitut alkuperäiset kohdat erottavat yrityksen koon,
määräävän aseman ja sen väärinkäytön. Yrityskaupan kilpailuvaikutus ei ole
sama kuin yksittäisen yrityksen menestys. Myöhempiä liikevaihtorajoja,
päivittäistavarakaupan erityissääntöjä tai EU:n digimarkkinasäädöksen
portinvartijavelvoitteita ei lueta alkuperäiseen lakiin.

Osakeyhtiölain 624/2006 mukaan yhtiö on erillinen oikeushenkilö; sen
johdon tehtävä, omistajan tavoite ja yhteiskunnallinen hyöty ovat eri
arviointikohteita. Voitontuottamistarkoituksen yhtiöjärjestyspoikkeus
säilytetään näkyvissä. Laki ei koske kaikkia yritysmuotoja eikä kaikkia
ulkomaisten konsernien yhtiöitä. Voimaantulo tarkistetaan 625/2006:n 1 §:stä.

Kaikki suhteet ovat perusteltuja kontekstikytkentöjä (`proposed`), eivät
lainvastaisuuden toteamuksia tai osoitettuja kausaalivaikutuksia.

Kuluttajansuojalain 38/1978, sen 2 luvun muutoslain 561/2008 ja kilpailulain
948/2011 puuttuvat luetteloidentiteetit lisätään erillisellä `catalog: market`
-täydennyksellä. Lähdetiedot ovat `lakikartta-market-additions.json`-tiedostossa.
Tämä ei muuta aiempien lisäysten provenienssia eikä laske uusille riveille
verkostomittareita. Muutoslain suhde 38/1978:aan kirjataan lähdemetadataan,
eikä siitä päätellä automaattisesti kausaalista verkostoyhteyttä.

## Kuudes ketju: ympäristö, metsä ja energia

Neljä ankkuria, 10 kytkentää viiteen artikkeliin. Perustuslain 20 § koskee
luontoa, monimuotoisuutta, ympäristöä ja kulttuuriperintöä; se ei määrää
hakkuumäärää, yhtä energiavalintaa tai yhtä kansallista kertomusta.
Metsälain 1093/1996 alkuperäinen tavoite sekä 10–11 §:n elinympäristö- ja
poikkeussäännöt erotetaan myöhemmistä muutoksista, luonnonsuojelusta ja
kansallisen hiilinielun seurannasta.

Ilmastolain 423/2022 päästö- ja poistumatavoitteita sekä maankäyttösektorin
suunnittelu- ja seurantatehtäviä ei tulkita osoitetuiksi tuloksiksi. Laki ei ole
yksittäisen hakkuun tai energiahankkeen lupapäätös. Ilmastotase ja luonnon
monimuotoisuus tarvitsevat omat mittarinsa.

Sähkömarkkinalain 588/2013 alkuperäisten 51–52 §:n jakeluverkon laatua ja
kehittämissuunnitelmaa koskevat vaatimukset erotetaan tuotannon tehotaseesta,
vuosituotannosta ja sähkön hinnasta. 119 §:n siirtymäjärjestelyt huomioidaan:
kaikkien laatuvaatimusten toteutumista ei ajoiteta yleiseen voimaantuloon.
Säännöksiä ei sovelleta analogiana kaikkiin digitaalisiin tai liikenneverkkoihin.

Kytkennät ovat rajattuja kontekstisuhteita ja ehdotuksia (`proposed`). Ne
eivät varmista artikkelien inventaariolukuja eivätkä osoita lakien vaikutuksia.

## Public finance, debt and state ownership (2026-11-05)

The independent finance catalogue adds four historical anchors: Constitution 731/1999 sections 81–84 and 92, State Audit Office Act 676/2000, and state ownership Act 1368/2007. Sixteen proposed links reference eight independently revision-checked article records. Two records contain the same source text; record counts are not distinct-text counts. Original article text and summaries remain unchanged.

The budget framework concerns the state budget, not all general-government accounting. It does not establish a safe debt ratio or demonstrate the effects of a spending cut. The audit and ownership anchors use original historical provisions; later scope changes, ownership thresholds and the separate 2024 ownership policy decision must be verified separately. Audit reporting is not proof of corrective action. Method: `legal-links-finance-2026-11-05-v1`.

The exact-identity audit found 676/2000 and 1368/2007 absent from the Lakikartta catalogue. Independent additive manifest `editorial-finance-catalog-2026-11-05-v1` supplies only verified statutory identities and source provenance; graph metrics and current in-force status stay unknown. Existing catalogue records are preserved.

## Security, belonging, sovereignty and values (2026-11-05)

Independent catalogue `remaining` supplies six historical anchors and twelve proposed passage-based links for the six previously uncovered article records. The anchors concern constitutional security and legal protection, freedom of conviction and association, participation, international preparation and parliamentary information, original Act 1390/1992 and original Emergency Powers Act 1552/2011. These are contextual or explicit-reference links, not measured effects. Historical provisions do not establish present-day organisational arrangements, NATO accession or membership benefits. Association rights do not guarantee subjective belonging. Original article content is preserved. Method: `legal-links-remaining-2026-11-05-v1`.

## Historical depth and research evidence: comprehensive school (2026-11-05)

Method `legal-links-history-education-2026-11-05-v1` adds a historical 467/1968 anchor to three articles. Enactment (26 July 1968), legal commencement (1 August 1970), regional implementation (1972–1977), and research outcomes are separate fields. The original statute reproduction is identified with its external archival host; the live Finlex identity page is retained, while the unavailable original-statute route is not presented as a working text source. Original section 5 allowed differentiated upper-stage syllabuses.

Two findings cite the actual research working-paper versions: IFAU 2006:13 on father–son income elasticity and IZA 4058 (2009) on military cognitive tests. Each records outcome, population, method, source locator, limitations and publication family. Later journal versions are not counted as independent replications. The income estimate −0.069 is an elasticity change, not a seven-percent earnings gain. Cognitive results distinguish the small verbal mean effect, absence of significant arithmetic/logical mean effects, and benefits among sons of basic-educated parents. No claim is made about women, all future cohorts, political-elite access or an individual statutory provision's isolated effect.

Private article links reference explicit finding IDs and state their limited scope. The importer rejects unknown references and quasi-experimental findings without population or method. This is the first focused historical research batch; it is not a complete impact assessment of all linked laws.
