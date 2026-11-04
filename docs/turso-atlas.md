# Atlasin rakenteen lukukopio Tursoon

## Käynnistys iPadilla
GitHub Actions → Turso Atlas structure transfer → Run workflow → main.
Valitse **Write and verify Atlas structure in Turso**, kun haluat kirjoitusajon.
Ilman valintaa luetaan ja tarkistetaan koko lähde, mutta Tursoon ei oteta yhteyttä.
Samat SUPABASE_READ_KEY ja TURSO_AUTH_TOKEN -salaisuudet kuin havaintosiirrossa.
Palvelinavain tarvitaan myös julkaisemattomiin sisältöihin; älä avaa RLS-sääntöjä.

Edellytykset: 32 teemaa ja 2461 sarjakuvausta on siirretty ja varmennettu.
Havaintosiirron pitää olla valmistunut PASS-merkintään ennen jatkamista.
Siirrot käyttävät samaa concurrency-ryhmää, joten ne eivät kirjoita yhtä aikaa.

## Rajaus
13 taulua, yhteensä 6846 riviä. Tarkistettu lähteestä 4.11.2026.

| Taulu | Rivejä |
|---|---:|
| atlas_evidence_links | 71 |
| atlas_links | 147 |
| atlas_mechanism_cases | 431 |
| atlas_mechanism_cluster_members | 368 |
| atlas_mechanism_clusters | 8 |
| atlas_mechanism_relations | 517 |
| atlas_mechanisms | 231 |
| atlas_stage_mechanisms | 717 |
| atlas_stage_variables | 192 |
| atlas_theme_variables | 33 |
| atlas_variable_indicators | 2986 |
| atlas_variables | 33 |
| items | 1112 |

Kohdenimet ovat public__ + lähdetaulun nimi.
items on mukana, koska tapaus- ja evidenssilinkit viittaavat sisältökortteihin.
atlas_admins ja käyttäjähallinta eivät kuulu siirtoon.
Korttien relations-taulu, lakikartta, research sekä muut aineistot jäävät myöhempiin vaiheisiin.
Sovellus käyttää edelleen nykyisiä JSON-aineistoja ja yhteyksiä.

## Tarkistus ja uudelleenkäynnistys
Kaikki lähdetaulut luetaan ja niiden odotettu rivimäärä tarkistetaan ennen kohdekirjoituksia.
Kunkin taulun kaikki lähdekentät säilyvät; JSON/taulukot ovat JSON-tekstiä ja boolit 0/1.
Käytössä ovat indikaattorisiirron desimaalitarkka JSON ja insert-only-vertaillu.
Yhtään poikkeavaa kohderiviä ei korvata tai poisteta.
Kirjoitetut erät luetaan takaisin, ja lisäksi koko kohdetable verrataan lähteeseen.
Kaikki tämän vaiheen ilmoitetut vierasavaimet tarkistetaan, myös teema-, sarja- ja korttiviittaukset.
Lopussa kaikki lähdetaulut luetaan uudelleen ja niiden tiivisteiden pitää vastata ensimmäistä lukua.
Odotettu lokin loppu: PASS: Atlas structure, all contents and references verified.

Keskeytyksen jälkeen käynnistä sama ajo uudelleen: se tarkistaa kaiken alusta ja käyttää samoina säilyneet kohderivit uudelleen. Tämä pieni siirto ei käytä havaintosiirron eräkirjanpitoa eikä muuta sen jatkokohtaa.
Pidä lähde muuttumattomana koko siirron ajan. REST-haut eivät ole atominen PostgreSQL-tilannekuva.
Jos sisältö on muuttunut kohteeseen kirjoittamisen jälkeen, ajo pysähtyy; älä poista rivejä tai ohita vertailua käsin.
PostgreSQL:n triggerit, RLS, oletusarvot ja ylläpidon toiminnallisuus eivät siirry.
Lähteeseen ei kirjoiteta. Kokonaisuus ei ole vielä Supabasen korvaava sovelluspalvelu.

## Testaus
python -m unittest discover -s scripts/migration -p 'test_turso*.py'
