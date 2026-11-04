# Tutkimusaineistojen (research) siirto Tursoon

## Rajaus
48 taulua, 99817 riviä, määrät tarkistettu 4.11.2026. 38 taulussa on sisältöä; kymmenen tyhjää taulurakennetta kopioidaan myös.
Sisältää havainnot, johdetut arvot, laskenta-ajot ja syötteet, vaikutusmallit ja tulokset, lähteet, versiot, alueluokitukset, arvioinnit sekä tutkimustehtävät ja lokit.
Kohdenimi research__TAULU säilyttää eron public.indicator_values-, selitysatlas- ja muihin samannimisiin aineistoihin.
Yksityisiä rivejä ei tallenneta julkiseen GitHub-repoon tai lokiin. Repo sisältää vain siirtokoodin, skeemakuvaukset ja lukumäärät.
Arviointi-skeema, kuvabinaarit, muut palvelut ja käyttöönotto ovat edelleen erillisiä tehtäviä.

## Käynnistys ja jatkaminen
Päähaaraan yhdistetty siirtokoodi/workflow käynnistää kirjoitusajon automaattisesti.
Manuaalisesti Actions → Turso research transfer → Run workflow → main → Write and verify research in Turso.
Samat SUPABASE_READ_KEY ja TURSO_AUTH_TOKEN. Manuaalinen ajo ilman kirjoitusvalintaa tarkistaa vain ensimmäisen rivin kustakin taulusta; SAMPLE/PARTIAL ei ole kokosiirto.
Aiemmin varmennetut atlas_mechanisms 231 ja atlas_themes 32 ovat ulkoisia vanhempia.
Yhteinen concurrency-ryhmä estää rinnakkaiset siirrot.

500 rivin alkuperäiseen pääavaimeen perustuvat sivut. UUID-avaimia verrataan PostgreSQL:ssä UUID-arvoina, kokonaislukuja kokonaislukuina. Yhdistelmäavaimet käsitellään rivivertailulla.
Kaikki sarakkeet säilyvät: numeric täsmällisenä tekstinä, UUID:t/päivät/aikaleimat tekstinä, JSON/taulukot JSON-tekstinä, boolit 0/1.
Kohteeseen lisätään vain puuttuvat rivit; ristiriitaisia ei korvata tai poisteta. Jokainen sivu luetaan takaisin ja verrataan kaikkiin lähdekenttiin ennen jatkokohdan tallennusta.
Tutkimusaineiston suuret JSON-tilannekuvat käyttävät 4 MiB:n rivikohtaista rajaa JSON-koodatuille argumenteille ja yli 512 KiB:n rivit lähetetään yksittäin. Suurin tarkistettu lähderivi oli 1628393 tavua ennen siirtokoodausta.

_research_transfer_pages_v1 tallentaa samalla rivillä alku- ja loppukursorin, asetukset, määrät ja SHA256-tiivisteen.
Uusi ajo varmentaa viimeisen lähde- ja kohdesivun ennen jatkamista. Jos lisäys onnistui mutta kirjanpito ei tallentunut, vastaavat rivit käytetään uudelleen.
90 minuutin aikabudjetti päättyy PARTIAL-merkintään ja koodiin 2 ennen workflow'n 120 minuutin rajaa. Käynnistä sama kirjoitusajo uudelleen. Verkkokatkoksesta voi jatkaa samoin.
Älä muuta lähdettä, sivukokoa, määriä tai kirjanpitoa kesken siirron.
REST ei ole atominen tilannekuva. Jatkoajo tarkistaa vain viimeisen sivun lähdemuutokset ja luottaa aiempiin onnistuneisiin sivuvertailuihin. Jos lähde muuttuu, valmistele uusi versioitu kohde.

## Viittaukset ja valmistuminen
98 ilmoitettua vierasavainta tarkistetaan lopuksi, myös itsereferenssit, taulujen väliset kehät, yhdistelmäviittaukset ja kuusi Atlas-viittausta.
Viittauskehissä olevia rivejä ei poisteta eikä niiden suhteita tulkita uudelleen; kopiointi luo taulut pääavaimineen ja varmentaa vierasavaimet, kun kaikki taulut on kopioitu.
Kunkin taulun lopussa tarkistetaan, ettei lähteessä näy lisäriviä ja että kohteen kokonaismäärä täsmää.
Odotettu viimeinen lokirivi:
PASS: Research complete; 48 tables, 99817 rows and all 98 declared references verified.

Triggerit, PostgreSQL:n RLS/UNIQUE/CHECK-säännöt, näkymät, laskentakoodin palvelinajo, julkaisu ja sovelluksen yhteydet eivät siirry automaattisesti.
PASS tarkoittaa aineiston lukukopion varmennusta.

## Palvelinlukija ja siivous
migration_research_page_v1 on STABLE SECURITY INVOKER tyhjällä search_pathilla. Vain service_role saa suorittaa, ja current_user tarkistetaan. PUBLIC/anon/authenticated eivät saa EXECUTE-oikeutta.
48 kiinteää taulua, parametrisoidut kurso­rit, sivuraja 1–500. Käyttäjän tunnisteita ei yhdistetä SQL-lauseisiin. Funktio ei kirjoita lähdetauluihin eikä avaa research-skeemaa julkiseksi.
service_role-roolilla oli aiemmin skeeman USAGE ja SELECT 19 tauluun. Lisättiin SELECT vain puuttuviin 29 tauluun.
install-research-reader.sql on jo suoritettu lähdeprojektissa, ei yleinen automaattinen sovellusmigraatio.
Kun PASS on varmennettu eikä uudelleenlukua tarvita, cleanup-research-reader.sql poistaa RPC:n ja vain nämä 29 lisättyä SELECT-oikeutta; aiempi USAGE ja 19 aiempaa SELECT-oikeutta säilyvät. Älä siivoa kesken ajon.
Siivouksen jälkeen uusi ajo edellyttää lukijan uutta valmistelua.
Asennus/oikeudet tehtiin samassa transaktiossa ilman julkista suoritusikkunaa. RLS-sääntöjä ei muutettu.

## Validointi
Kaikki 50 paikallista migraatiotestiä läpäisivät.
Palvelinroolin live-SQL-testi palautti kaikista 48 taulusta odotetun ensimmäisen sivun.
Havaintojen UUID-pääavaimista sekä vaikutuspisteiden UUID/vuosi/tekijä/ryhmä-yhdistelmäavaimista kummankin kaksi sivua, 1000 avainta, vastasivat suoraa SQL-hakua.
SECURITY DEFINER=false, anon/authenticated EXECUTE=false ja service_role EXECUTE=true.
Tietoturvaneuvot tarkistettu.

| Lähde | Rivejä |
|---|---:|
| research.area | 736 |
| research.area_classification | 8 |
| research.area_mapping | 656 |
| research.audit_log | 1742 |
| research.card_citation | 0 |
| research.card_evidence_assessment | 36 |
| research.card_section | 91 |
| research.card_version | 9 |
| research.claim | 12 |
| research.claim_version | 13 |
| research.computation | 13 |
| research.computation_input | 62 |
| research.computation_run | 30 |
| research.coverage_assessment | 0 |
| research.coverage_cell | 0 |
| research.coverage_evidence | 0 |
| research.dataset | 29 |
| research.dataset_version | 30 |
| research.derived_value | 18750 |
| research.evidence_kind_exception | 0 |
| research.evidence_link | 15 |
| research.hypothesis | 0 |
| research.hypothesis_test | 0 |
| research.hypothesis_version | 0 |
| research.impact_channel | 515 |
| research.impact_external_revision | 1 |
| research.impact_input_binding | 8 |
| research.impact_model | 3 |
| research.impact_model_run | 20 |
| research.impact_model_theme | 96 |
| research.impact_point | 13376 |
| research.impact_release | 2 |
| research.impact_run_check | 20 |
| research.impact_snapshot | 2 |
| research.impact_theme_year | 11264 |
| research.indicator | 25 |
| research.indicator_definition | 25 |
| research.observation | 52119 |
| research.open_question | 16 |
| research.period | 0 |
| research.plot | 0 |
| research.research_case | 3 |
| research.research_task | 21 |
| research.retrieval | 30 |
| research.revision_basis | 1 |
| research.source | 32 |
| research.source_locator | 3 |
| research.source_type | 3 |
