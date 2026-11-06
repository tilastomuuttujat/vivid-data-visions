# Artikkeleiden yhteinen väestöperusta

Ensimmäinen kerros yhdistää väestökehityksen kuuteen yksityisen artikkelikokoelman ryhmään: työ, koulutus, hoiva, sosiaaliturva, alueet ja julkinen talous. Alueellinen kerros on kytketty kuulumista ja muuttoliikettä käsittelevään artikkeliin; tämä ei tarkoita erillisen aluehistorialuvun valmistumista. Alkuperäiset artikkelitekstit säilyvät. Uudet, versioidut täydennykset näkyvät editorin nykyisessä lähde- ja väitematriisissa.

## Aineisto ja ajallinen kattavuus

| StatFin | Sisältö | Valinta | Luonne |
|---|---|---|---|
| 12dx | Väkiluku, syntyneet, kuolleet, luonnollinen lisäys, maahan- ja maastamuutto, nettomaahanmuutto, kokonaismuutos | 1850–2025 | Toteutunut tilasto; muuttosarjojen varhaisia puuttuvia tietoja ei täytetä |
| 12dt | Kokonaishedelmällisyysluku | 1850–2025 | Periodimittari, ei sukupolven lopullinen lapsiluku |
| 11rc | Koko väestö ja toisensa poissulkevat viisivuotisikäryhmät | 1865–2025 | Toteutunut tilasto; ei ikärakennearvioita 1850–1864 |
| 11ra | Väkiluku, ikäosuudet, väestöllinen huoltosuhde, ulkomailla syntyneiden määrä ja osuus | 1990–2025, koko maa ja 19 maakuntaa | Vuoden 2026 aluejaolla; ei etnisyyden mittari |
| 128t | Koko väestö ja yksivuotisikäryhmät | 2026–2050 | Vuoden **2024** ehdollinen väestöennuste; ei päivitetty vuoden 2025 toteumasta |

Lähteiden alkuperäiset vastaukset, metatiedot, täsmälliset API-kyselyt ja SHA-256-tiivisteet ovat hakemistossa `scripts/editorial/sources/population-foundation/`. Toistettava keruu: `python scripts/editorial/collect_population_foundation.py`. Keruu ei kirjoita tietokantaan. Uusi lähdeversio edellyttää uutta tuontiversiota ja artikkelikytkentöjen tarkistamista; vanhaa versiota ei korvata eri sisällöllä.

Yhteinen lähdeaineisto tallennetaan Turson `editorial__population_foundation`-tauluun viitenä muuttumattomana lähdekuvana. Kuusi artikkelikytkentää tallentuvat nykyiseen `editorial__article_evidence_supplements`-tauluun. Ne viittaavat samaan lähdeversioon ja aineistotiivisteisiin. Lähdekuvien solumäärä ei tarkoita yhtä monta itsenäistä havaintoa: mukana ovat myös summat ja niistä riippuvat tunnusluvut.

## Ensimmäisen kytkennän tulokset

| Ryhmä | Väestöaineiston tuoma rajaus |
|---|---|
| Työ | 15–64-vuotiaita oli 3 361 310 vuonna 1990 ja 3 497 657 vuonna 2025. Ikääntyminen ei tarkoita tämän ikäryhmän määrän vähenemistä näiden päätevuosien välillä. Määrä ei mittaa työvoimaa tai työtunteja. |
| Koulutus | Vuonna 1950 syntyi 98 065 ja vuonna 2025 45 832 lasta. Ikäluokan koko on erotettava koulutukseen osallistumisesta ja sen vaikutuksista. |
| Hoiva | Vähintään 65-vuotiaiden määrä kasvoi 266 650:stä (1950) 1 347 494:ään (2025). Määrä ei sellaisenaan mittaa toimintakykyä tai hoivan tarvetta. |
| Sosiaaliturva | Käyttäjäryhmien väestöllinen tausta muuttuu; etuusoikeus, etuuden käyttö ja asiointikyky vaativat eri aineistot. |
| Alueet | Vuonna 2025 vähintään 65-vuotiaiden osuus oli Uudellamaalla 18,6 % ja Etelä-Savossa 34,6 %. Ero ei osoita muuttoliikkeen vaikutusta tai yksinäisyyden yleisyyttä. |
| Julkinen talous | Väestöllinen huoltosuhde oli 57,8 vuonna 1950, 48,7 vuonna 1990 ja 61,6 vuonna 2025. Se ei ole työllisten ja etuudensaajien suhde eikä kestävyyslaskelma. |

Huoltosuhde lasketaan samoilla rajoilla: (alle 15-vuotiaat + vähintään 65-vuotiaat) / 15–64-vuotiaat × 100. Laskenta säilyttää lähteen avoimen ylimmän ikäluokan. Ikäryhmien summat tarkistetaan kaikkina vuosina, ei vain yllä olevina vertailuvuosina.

## Ennuste ja sen ehdot

Vuoden 2024 ennusteen vuoden 2050 väkiluku on 6 177 141. Sen oletuksena on kokonaishedelmällisyysluku 1,26 ja vuodesta 2026 alkaen nettomaahanmuutto 40 000 vuodessa; ikäkohtainen kuolleisuus alenee lähteen menetelmän mukaisesti. Vuonna 2025 toteutuneet luvut olivat 1,30 ja 31 233. Ennusteen ehtojen ja toteumien ero näkyy, mutta sitä ei muuteta omaksi uudeksi ennusteeksi.

Ennusteen vuoden 2050 väestöllinen huoltosuhde on samalla laskutavalla 61,4. Lähellä vuoden 2025 tasoa oleva suhdeluku ei tarkoita muuttumatonta palvelutarvetta: lasten ja ikääntyneiden suhteet, ikääntyneiden sisäinen ikärakenne ja työllisyys voivat erota. Kansallinen ennuste ulottuu vuoteen 2050; tästä ei tuoteta maakunnille vuoden 2050 arvoja.

Menetelmä: [Tilastokeskus, väestöennusteen dokumentaatio](https://stat.fi/fi/dokumentaatio/tilastojen-dokumentaatio/vaenn). Historiallisten taulukoiden merkinnät nälkävuosista, sisällissodasta, sodista ja Ruotsiin muutosta ovat kontekstia, eivät laskettuja kausaalivaikutuksia. Vuoden 1868 luonnollinen väestönlisäys oli −93 963; sitä ei nimetä nälänhädän aiheuttamien kuolemien määräksi.

## Jäljelle jäävä työ

Väestöpohja ei vielä ole väestönmuutoksen syiden analyysi tai valmis skenaarioperhe. Seuraavat liitokset vaativat omat lähteensä: työkyky ja tehdyt tunnit; kouluikäiset ja koulutuspaikat; 75-/85-vuotiaiden toimintakyky ja palvelut; etuuksien alikäyttö; ikä- ja koulutuskohtainen alueellinen muuttoliike; ikäryhmittäiset verot ja menot. Historiallisia aluerajoja ei ole harmonisoitu nyky-Suomeen. Kansallinen 1850–2050 akseli ei tarkoita jokaisen muuttujan yhtä pitkää vertailukelpoista sarjaa.

Tarkistukset: `python -m unittest discover -s scripts/editorial -p 'test_population_foundation.py'`. Tuonnin jälkeen avataan uusi tietokantayhteys ja verrataan sekä viittä lähdekuvaa että kuutta täydennystä; artikkelien revisiot ja tekstitiivisteet tarkistetaan.

Ensimmäinen jatkokytkentä on [väestöstä työllisyyteen ja tehtyyn työpanokseen](population-work.md): kaksi jo Atlasissa olevaa aineistoa tarkistetaan alkuperäislähteistä ja liitetään työn sekä julkisen talouden artikkeleihin. Se erottaa rekisterityöllisyyden, ikärakennevertailun ja vuotuiset työtunnit.

Toinen jatkokytkentä käsittelee [koulutuksen väestöpohjaa ja toteutuneita oppilasmääriä](population-education.md): kansallinen 7–15-vuotiaiden sarja, kaikkien kuntien päätevertailu sekä vuosiluokkien 1–9 oppilaat erotetaan koulutuksen osallistumisesta, kapasiteetista ja vaikutuksista.

Kolmas jatkokytkentä koskee [hoivan väestöpohjaa ja toteutunutta kotihoitoa](population-care.md): 75–84- ja 85 vuotta täyttäneiden kehitys, erillinen vuoden 2024 ennuste ja vuoden 2025 kotihoitoraportin lähdetarkistus. Väestömäärä, palvelukäyttö, hoivan tarve ja läheisten työ säilyvät eri käsitteinä.

Neljäs jatkokytkentä käsittelee [sosiaaliturvan väestöpohjaa perustoimeentulotuen kautta](population-security.md): vuosien 2024–2025 ikä-, sukupuoli- ja kotitalousluvut kytketään kahteen artikkeliin. Käyttöä ei samasteta tarpeeseen tai etuusoikeuteen, eikä koko Suomen väestöpohjasta lasketa tarkistamattomia saamisasteita.

Viides jatkokytkentä käsittelee [alueiden väestötaseita](population-regions.md): syntyneet, kuolleet, kotimainen nettomuutto, nettomaahanmuutto ja korjauserä erotellaan 19 maakunnalle vuosina 1990–2025 virallisella vuoden 2026 luokitusavaimella. Väestötase ei yksin selitä muuttamisen motiiveja tai koettua kuulumista.

Kuudes jatkokytkentä käsittelee [julkisyhteisöjen tehtävämenoja ja väestöpohjaa](population-fiscal.md): nimellismenot, saman lähdeversion BKT-osuudet ja ikärakenne erotetaan. Tarkat tehtävät alkavat 2001, vuosi 2024 on ennakkotieto; reaalisia kustannuksia, demografista vaikutusta tai kestävyysvajetta ei arvioida tästä yksin.

## Kuuden artikkeliryhmän ensimmäisen väestökierroksen yhteenveto

| Ryhmä | Nyt kytketty määrällinen perusta | Keskeinen avoin kysymys |
|---|---|---|
| Työ | Rekisterityöllisyys, ikärakennevertailu ja vuotuiset työtunnit | Työkyky, työajan ja toimialojen vaikutukset |
| Koulutus | Kouluikäiset, kuntien jakauma ja toteutuneet vuosiluokat | Saavutettavuus, henkilöstö, kapasiteetti ja oppimistulokset |
| Hoiva | Vanhimmat ikäryhmät, erillinen ennuste ja kotihoidon käyttö | Toimintakyky, riittävyys ja läheisten työ |
| Sosiaaliturva | Perustoimeentulotuen ikä- ja kotitalousjakauma | Yhteensopivat nimittäjät, oikeutetut, siirtymät ja alikäyttö |
| Alueet | Luonnollinen muutos, kotimainen ja kansainvälinen muuttoliike | Muuttamisen motiivit ja alueiden ikä-/osaamisrakenne |
| Julkinen talous | Sulautetut tehtävämenot ja niiden jakauma | Hinnat ja määrät, etuustaso, tulot ja vaikutukset |

Tämä on ensimmäinen yhteinen evidenssikerros. Se ei tarkoita kaikkien ryhmiin kuuluvien artikkelien tai ajanjaksojen valmistumista. Pienet lähdetäydennykset eivät sulje laajoja tutkimusaukkoja eivätkä muuta mekanismihypoteeseja kausaalisiksi tuloksiksi.
