# Julkisen talouden siirto Tursoon

## Käynnistys
Siirtokoodin tai tämän workflow-tiedoston muutos päähaaraan käynnistää kirjoitusajon automaattisesti. PR-tapahtuma ei käynnistä siirtoa. Jatkossa koodin muutokset voivat siis käynnistää uuden varmennuksen; yhteinen concurrency-ryhmä estää rinnakkaiset siirrot.

Manuaalisesti: Actions → Turso public finance transfer → Run workflow → main → **Write and verify public finance in Turso** → Run workflow.
Ilman valintaa manuaalinen ajo tarkistaa vain ensimmäisen sivun kustakin lähdetaulusta; SAMPLE/PARTIAL ei tarkoita valmista siirtoa.
Samat SUPABASE_READ_KEY ja TURSO_AUTH_TOKEN -salaisuudet kuin aiemmissa siirroissa. Vain palvelinavain, joka näkee koko lähteen. Julkista RLS:ää ei muuteta.
items-lukukopiossa tulee olla aiemmin varmennetut 1112 riviä.

## Rajaus
Lähdemäärät tarkistettu 4.11.2026:
- public_finance_sources: 139
- public_finance_series: 32661
- public_finance_observations: 970849
- public_finance_item_links: 24
Yhteensä 1003673 riviä. Kohdenimet public__ + alkuperäinen nimi.

Kaikki sarakkeet säilyvät. PostgreSQL numeric (arvot ja kertoimet) tallennetaan desimaalitarkkana tekstinä, JSON JSON-tekstinä. Tuotantoyhteydet, RLS, triggerit, päivitysprosessit ja julkaisu eivät vaihdu.
Lähteeseen ei kirjoiteta. Kohteesta ei poisteta eikä poikkeavia rivejä korvata.

## Sivutus ja jatkaminen
Kaikki neljä taulua luetaan 500 rivin pääavainsivuina. Yhdistelmäavaimet:
- havainnot: series_key, year, value_kind
- korttilinkit: series_key, item_id, relation_type
Jokaisen sarakekombinaation seuraaja haetaan erillisinä, toisensa poissulkevina indeksihaun alueina. Suodatinraaka-arvot URL-koodataan; niihin ei lisätä JSON-lainausmerkkejä.

Jokainen sivu verrataan kaikkiin olemassa oleviin kohderiveihin ennen puuttuvien lisäystä. Kirjoitus luetaan takaisin ja verrataan kokonaan ennen jatkokohdan kirjaamista.
_finance_transfer_pages_v1 tallentaa saman rivin sisään sivun aloitus- ja lopetuskursorin, rivimäärän, asetukset ja SHA256-tiivisteen. Seuraava ajo varmentaa viimeisen sivun lähteestä ja kohteesta ennen jatkamista. Vanhat havaintosiirron kirjanpidot eivät muutu.
Toistuvat sivut, paikalleen jäävä kursori, poikkeava sisältö tai puuttuva lähdesivu pysäyttävät ajon.
Jos lisäys onnistuu mutta jatkokohdan tallennus epäonnistuu, seuraava ajo käyttää jo lisätyt vastaavat rivit uudelleen.

Ajo varaa korkeintaan 5 h 30 min aktiiviseen etenemiseen; workflow-raja on 6 h. Jos aika loppuu, lokiin tulee PARTIAL ja ajo päättyy koodiin 2. Käynnistä sama kirjoitusajo uudelleen. Tämä ei ole PASS.
Verkkokatkos voi myös keskeyttää ajon. Tallennetut erät säilyvät.
Älä muuta odotettuja määriä tai sivukokoa kesken siirron.

## Valmistumisen ehto
Jokaisen taulun jälkeen tarkistetaan, ettei lähteessä näy ylimääräistä seuraavaa riviä ja että kohteen rivimäärä täsmää.
Lopussa kaikki neljä ilmoitettua vierasavainta tarkistetaan, mukaan lukien viittaukset aiemmin siirrettyihin kortteihin.
Odotettu viimeinen lokirivi:
PASS: Public finance complete; 1003673 rows and all references verified.

Pidä lähde muuttumattomana ensimmäisestä kirjoitusajosta valmistumiseen. REST ei ole yhden ajanhetken tietokantatilannekuva. Jatkoajo varmentaa vain viimeisen sivun, ei aiempien lähdesivujen kaikkia muutoksia. Aiempiin onnistuneisiin kohdevertailuihin luotetaan. Jos lähde muuttuu, älä ohita vertailuja tai nollaa kirjanpitoa: valmistele uusi versioitu kohde.
PASS ei vahvista sovelluksen käyttöönottoa tai koko Supabase-projektin siirtymistä.

## Testit
python -m unittest discover -s scripts/migration -p 'test_turso*.py'
