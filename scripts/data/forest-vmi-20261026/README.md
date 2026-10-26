# Luken inventointeihin perustuva metsäkokonaisuus

Erä `luke_forest_vmi_1918_2025_20261026_v1`: 11 sarjaesitystä, 1 018 arvoa. Julkaistavaa lähdekontekstia 987 arvoa, tarkistettavia 31. Tiedot eivät ole 1800-luvulle ulotettuja metsäarvioita: inventoinnit alkavat 1921–1924; kokonaispoistuman lähdesarja alkaa 1918 ja hakkuukertymä 1985.

## Sisältö ja aluerakenne

Viisi pinta-alasarjaa: metsämaa, kitumaa, joutomaa, metsätiet/varastot ja metsätalousmaa yhteensä. Lisäksi puuston tilavuus metsä- ja kitumaalla, keskitilavuus metsämaalla, inventointipohjainen vuotuinen kasvu ja keskikasvu sekä vuosittainen kokonaispoistuma ja hakkuukertymä.

Inventointitauluissa on koko maa, Etelä-/Pohjois-Suomi ja 19 maakuntaa siltä osin kuin lähde julkaisee arvon. Aluehierarkia on päällekkäinen: koko maan arvoa, makroalueita ja maakuntia ei saa summata keskenään. Puuttuvat alue-/inventointisolut säilyvät puuttuvina. Kasvun varhaisille vanhojen valtiorajojen arvoille on lisäksi erillinen aluetunniste, yhteensä aineistossa 23 aluetunnistetta. Vuotuinen poistuma ja hakkuukertymä tuodaan vain koko maalle.

## Aika, pinta-ala ja rajat

- Inventointiarvon `year` on **jakson loppuvuoden näyttöankkuri**. `period`, `inventory_start` ja `inventory_end` säilyttävät todellisen inventointijakson. Esimerkiksi 2024 tarkoittaa VMI13/14:n mittausjaksoa 2020–2024, ei yksittäistä mittausta vuonna 2024. Inventointiarvoja ei kopioida kaikille välivuosille.
- Kasvu on koealan mittausta edeltäneiden viiden kasvukauden keskimääräinen vuotuinen kasvu. Se ei ole sama kuin inventointijakson jokaisen kalenterivuoden mitattu kasvu. Päällekkäiset mittausjaksot eivät ole riippumattomia havaintoja.
- Ahvenanmaan ja Ylä-Lapin mittausvuosien sekä VMI12:n Ylä-Lapin vanhemman aineiston poikkeukset on merkitty riviin soveltuvin osin. Esimerkiksi Ahvenanmaan viimeisin havainto on mitattu 2023, vaikka se sisältyy VMI2020–2024-julkaisuun.
- Pinta-alan ja tilavuuden VMI1-luvut on lähteen mukaan laskettu nykyrajoille. Kasvun VMI1 ja VMI2.1 käyttävät ennen vuoden 1944 alueluovutuksia ollutta Suomea: ne tallennetaan aluetunnisteella `FI.BORDERS_PRE1944`. VMI2.2:n nykyrajoihin sovitettu arvo säilyy erillisenä `FI`-havaintona. Kaksi vuoden 1938 kasvupistettä eivät ole kaksoiskappaleita.
- VMI1–3:n metsä-/kitumaan luokitus ei täysin vastaa nykyistä. Metsätalousmaa sisältää muitakin maaluokkia kuin metsämaa. Suojelualueiden metsätalousmaa sisältyy maaluokitukseen.
- Kokonaispuuston tilavuus kattaa metsä- ja kitumaan; keskitilavuus m³/ha tässä taulussa vain metsämaan. Tämän vuoksi niitä ei jaeta ristiin samaksi pinta-alaksi olettaen.

## Julkaisurajaukset ja puuttuva tieto

Neljä VMI1:n koko maan maaluokkasolua pidätetään: osaluokkien julkaistut pinta-alat summautuvat 26 884 tuhanteen hehtaariin, mutta kokonaisalaksi on julkaistu 26 844. Erotus on 40 tuhatta hehtaaria; alkuperäistä arvoa ei korjata arvaamalla. Puuttuvaa metsätie-/varastoalaa ei käsitellä nollana. Kyse on lähteen aritmeettisesta ristiriidasta, ei todetusta metsien muutoksesta.

Poistuman 27 vuosiarvoa 1918–1944 säilyvät tarkistettavina: valitun vuosivirtataulun varhaista valtiorajojen yhdenmukaistusta ei ole vahvistettu tässä erässä. Historiallisia arvoja ei ketjuteta nykyrajattuun inventointiin epäselvän aluerajauksen yli.

Vuosivirtataulun `KAS`- ja `KAS_V`-sarakkeita ei tuoda erillisiksi julkaistuiksi kasvusarjoiksi. `KAS` sisältää inventointipohjaisia lukuja ja sen viimeisin vuoden 2020 luku 103,20 vastaa VMI2020–2024:n kasvuarviota, ei yksittäisen vuoden 2020 mittausta. `KAS_V`-variantin 1918–1934 määritelmä-/aluerajaus ei ole tässä vahvistettu. Molemmat säilyvät alkuperäisissä lähdevastauksissa auditointia varten; ydinsarjaksi tuodaan suoraan inventointitaulun kasvu.

Valituista inventointitauluista puuttuu VMI4; tuonti ei keksi sitä tai muita välipisteitä. Puuttuvat `..`-solut eivät ole nollia. Viimeisin mukana oleva inventointi on 2020–2024, julkaisuvuosikerta 2025. Vuosivirtataulu ulottuu vuoteen 2025. Poistuman ja hakkuiden revisiot 2025/2026 on tallennettu riviin ja raakamuotoisiin alaviitteisiin.

## Suhde aiempaan aineistoon ja laskentaan

Vanha `fi.followup20261021.growing_stock_vmi2019_2023` säilyy ennallaan omistajaryhmäerittelyineen. Sen koko maan arvo 2 552 milj. m³ on ankkuroitu vuoteen 2019. Uuden sarjan sama VMI2019–2023-arvo on ankkuroitu jakson loppuun 2023. **Kyse on samasta inventoinnista, ei muutoksesta vuosien 2019 ja 2023 välillä.** Yhteys ja ankkurikäytäntö on dokumentoitu uuden sarjan metatietoihin.

Kasvusta ei vähennetä saman indeksivuoden poistumaa automaattisesti: aikaperusta ja inventointien otantavaihtelu edellyttävät erillistä mallia. Kokonaispoistuma sisältää hakkuukertymän lisäksi luontaisesti kuollutta ja hakkuissa metsään jäävää runkopuuta. Poistumaa ja hakkuukertymää ei summata erilliseksi käytöksi.

Kaikki arvot ovat lähdearvioita. Valituissa tauluissa ei ole numeerisia epävarmuusvälejä, joten niitä ei keksitä. Riippuvuusklusterit, aikaperusta, maa-alakäsite ja aluerajat on tallennettu. Kaikki sarjat ovat kontekstia luonnonvarateemalle, `include_in_composite=false`, paino null. Ei uusia kausaalireunoja eikä väitettä metsien hiilinielusta tai monimuotoisuuden kokonaistilasta.

## Toistaminen

```bash
python scripts/data/forest-vmi-20261026/build.py
python scripts/data/forest-vmi-20261026/build-import.py
python -m unittest discover -s scripts/data/forest-vmi-20261026 -p 'test_*.py'
```

Generoitunut `import.sql` on atominen insert-only PostgreSQL-tuonti. Identtinen uusinta ei lisää rivejä. Sisällön muuttaminen samalla erätunnisteella hylätään. Käytä uuteen lähdeversioon uutta erää ja sarjatunnisteita. `fetch.py` ei korvaa jo tallennetun lähteen hakukuittia, vaan käyttää sitä uudelleen. Rakentaminen ei tarvitse verkkoyhteyttä.

`sources/` sisältää kunkin taulun metadatan, tarkan POST-kyselyn, alkuperäisen JSON-vastauksen ja PX-vastauksen alaviitteineen sekä hakukuitin ja SHA-256-tiivisteet. Valitut indikaattoriarvot säilyvät alkuperäisinä numeromerkkijonoina ilman yksikkömuunnosta.

Lähteet: **Luonnonvarakeskus, Valtakunnan metsien inventointi / Metsävarat**, taulut 1.01, 1.16, 1.22 ja 1.24; **SVT: Luonnonvarakeskus, Hakkuukertymä ja puuston poistuma**, taulu 0500. Tarkat lähdeosoitteet ovat kyselyissä/hakukuiteissa ja sarjojen metatiedoissa. Lähdeviite tulee säilyttää jatkokäytössä.

Tietokantavertailu, idempotenssi ja viisi testiä on dokumentoitu `verification.json`-tiedostossa. Staattisia verkkonäkymien aineistovientejä ei päivitetä tässä erässä.
