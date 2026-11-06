# Väitteet ja aikakausimatriisi – ensimmäinen kerros

Artikkelieditorin **Väitteet ja aikakausimatriisi** avaa yksityisestä Turso-kirjastosta nykyiset aikakausianalyysit ja viimeisimmät artikkelikohtaiset lähdetäydennykset. GitHub-yhteydessä tiedot kulkevat nykyisen salatun Actions-vastauksen mukana. Artikkelitekstejä tai lähdetäydennyksiä ei julkaista HTML-tiedostoon. Näkymä ei kirjoita tietokantaan eikä muuta artikkelien toimituksellista tilaa.

Yhteiset aikakaudet ovat 1850–1899, 1900–1917, 1918–1945, 1946–1975, 1976–1994, 1995–2009, 2010–2025 ja 2026–2050. A laskee aikakausianalyysin osuvat merkinnät; L laskee osuvat lähdetarkistetut tulkinnat. Päällekkäisyys ei tarkoita koko aikakauden kattavaa näyttöä. Tulevaisuuden lähdeviite ei automaattisesti ole ennuste. Ajoittamattomat analyysijaksot näytetään erikseen. Vanhojen revisioiden täydennykset näkyvät varoituksella, mutta eivät kasvata matriisin lukuja. Puuttuva analyysitaulu erotetaan nollasta.

Väiterekisterin pysyvä johdettu avain on artikkelin UUID + täydennyksen tunniste. Se näyttää tarkan väitekatkelman, tulkinnan, muutospaineen, valinnan ja toteutuksen kohteen, havainnot ja niiden tukeman väitteen, rajat, vaihtoehtoisen selityksen, tutkimusaukon sekä lähteen paikantimen ja tarkistuspäivän. Ensimmäinen kerros ei kata kaikkia artikkelien väitteitä. Luokka on varovaisesti mekanismihypoteesi / lähdetarkistettu tulkinta: lähteen tarkistaminen ei hyväksy koko artikkelin kausaalista väitettä.

Seuraavat toimitukselliset vaiheet: yhteisten mekanismitunnisteiden hyväksyntä, väitteiden kuvaus/yhteys/hypoteesi/kausaaliarvio/skenaario-luokittelu väitekohtaisesti, näytön todellisten havaintovuosien erottaminen väljästä ajallisesta sijoituksesta ja väestöryhmäluokitus. Näitä ei päätellä automaattisesti sanahaulla. Kaksoiskappaleet säilyvät erillisinä tietueina kunnes toimituksellinen yhdistäminen on hyväksytty.

Tarkistukset: `node --test scripts/editorial/analysis-model.test.mjs`, `python -m unittest discover -s scripts/editorial -p 'test_*.py'`. Rakenna HTML muutoksen jälkeen: `python scripts/editorial/build_browser.py`.


## Väiteluokitus ja puutelista (6.11.2026)

`editorial__claim_reviews` säilyttää erillisen versionoidun luokitusehdotuksen jokaiselle 84 nykyiselle täydennysankkurille (38 artikkelitietuetta). Luokitus koskee tarkkaa artikkelikatkelmaa, ei lähdetutkimuksen menetelmää tai koko artikkelia. Luokat ovat kuvaus, havaittu yhteys, mekanismihypoteesi, kausaalinen arvio, skenaario, arviointisääntö, normatiivinen ehdotus ja luokittelematta. Tässä kierroksessa ei hyväksytä uusia kausaalisia arvioita. Jokainen luokitus on `editorial_proposal`, ei toimituksen hyväksyntä.

Tuonti tarkistaa artikkelin revision ja tekstitiivisteen, täydennyksen version ja koko sisällön tiivisteen sekä kaikkien nykyisten ankkurien ja artikkelien kattavuuden. Luokitus sidotaan näihin lähteisiin; muuttunut versio näkyy luokittelemattomana. Luokitukset eivät muuta alkuperäistä tekstiä, aiempia täydennyksiä, tiivistelmiä tai julkaisutilaa.

Havaintovuodet ovat aluksi NULL: olemassa oleva period-väli on täydennyksen ajallinen sijoitus, eikä sen kopioimista lähteen havaintovuosiksi sallita. NULL ei tarkoita, ettei lähteessä olisi vuosia. Se kertoo erillisen rakenteisen lähdevarmennuksen puuttuvan. Kohderyhmäkenttä säilyttää olemassa olevan rajauskuvauksen; sitä ei esitetä normalisoituna väestöluokituksena.

Editorin deterministinen puutelista kattaa kaikki kirjaston tietueet ja sisältää väitekatkelman, ajanjakson, puutteen ja seuraavan lähdetyön. P1 nostaa esiin vuosien 1850–1975 puuttuvan lähdeosuman tai havaintovuosivarmennuksen, tulevaisuusskenaarioiden erillisen perustarkistuksen ja vanhentuneet revisiot. P2 koskee puuttuvia luokituksia, havaintovuosia, kohderyhmiä ja aikakausikytkentöjä; P3 sisältää jo kirjatut tutkimusaukot. Säännöt ovat työjärjestys, eivät automaattinen väitteiden totuus- tai merkittävyysluokitus. Ajallinen osuma ei varmista väitteen sisältöä. Tulevaisuus- ja historiatarkistuksia ei poisteta vain lähdemäärän perusteella.

Puutelistan voi suodattaa prioriteetilla ja ladata yksityisenä JSON-tiedostona omalle laitteelle. Raportti muodostetaan nykyisestä avatusta kirjastosta; se ei kata artikkelien kaikkia vielä poimimattomia väitteitä. Kirjaston kaksoiskappaleet pidetään erillisinä tietueina. Toiminnon käyttö ei käynnistä ulkoista tiedonkeruuta tai muokkaa tietokantaa.
