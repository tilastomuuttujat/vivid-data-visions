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
