# Väitteet ja aikakausimatriisi – ensimmäinen kerros

Artikkelieditorin **Väitteet ja aikakausimatriisi** avaa yksityisestä Turso-kirjastosta nykyiset aikakausianalyysit ja viimeisimmät artikkelikohtaiset lähdetäydennykset. GitHub-yhteydessä tiedot kulkevat nykyisen salatun Actions-vastauksen mukana. Artikkelitekstejä tai lähdetäydennyksiä ei julkaista HTML-tiedostoon. Näkymä ei kirjoita tietokantaan eikä muuta artikkelien toimituksellista tilaa.

Yhteiset aikakaudet ovat 1850–1899, 1900–1917, 1918–1945, 1946–1975, 1976–1994, 1995–2009, 2010–2025 ja 2026–2050. A laskee aikakausianalyysin osuvat merkinnät; L laskee osuvat lähdetarkistetut tulkinnat. Päällekkäisyys ei tarkoita koko aikakauden kattavaa näyttöä. Tulevaisuuden lähdeviite ei automaattisesti ole ennuste. Ajoittamattomat analyysijaksot näytetään erikseen. Vanhojen revisioiden täydennykset näkyvät varoituksella, mutta eivät kasvata matriisin lukuja. Puuttuva analyysitaulu erotetaan nollasta.

Väiterekisterin pysyvä johdettu avain on artikkelin UUID + täydennyksen tunniste. Se näyttää tarkan väitekatkelman, tulkinnan, muutospaineen, valinnan ja toteutuksen kohteen, havainnot ja niiden tukeman väitteen, rajat, vaihtoehtoisen selityksen, tutkimusaukon sekä lähteen paikantimen ja tarkistuspäivän. Ensimmäinen kerros ei kata kaikkia artikkelien väitteitä. Luokka on varovaisesti mekanismihypoteesi / lähdetarkistettu tulkinta: lähteen tarkistaminen ei hyväksy koko artikkelin kausaalista väitettä.

Seuraavat toimitukselliset vaiheet: yhteisten mekanismitunnisteiden hyväksyntä, väitteiden kuvaus/yhteys/hypoteesi/kausaaliarvio/skenaario-luokittelu väitekohtaisesti, näytön todellisten havaintovuosien erottaminen väljästä ajallisesta sijoituksesta ja väestöryhmäluokitus. Näitä ei päätellä automaattisesti sanahaulla. Kaksoiskappaleet säilyvät erillisinä tietueina kunnes toimituksellinen yhdistäminen on hyväksytty.

Tarkistukset: `node --test scripts/editorial/analysis-model.test.mjs`, `python -m unittest discover -s scripts/editorial -p 'test_*.py'`. Rakenna HTML muutoksen jälkeen: `python scripts/editorial/build_browser.py`.
