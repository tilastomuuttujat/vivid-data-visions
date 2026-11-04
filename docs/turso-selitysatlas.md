# Selitysatlaksen ja infografiikkojen metatietojen siirto

20 taulua, 1079 riviä, lähdemäärät tarkistettu 4.11.2026.
18 taulua selitysatlas-skeemasta sekä public.infographics (288) ja public.selitysatlas_links (323).
Varsinaiset kuvatiedostot eivät siirry tässä ajossa.

| Lähde | Rivejä |
|---|---:|
| selitysatlas.categories | 5 |
| selitysatlas.contested_explanations | 1 |
| selitysatlas.decisions | 4 |
| selitysatlas.dictionary | 6 |
| selitysatlas.evidence_levels | 4 |
| selitysatlas.exogenous_events | 2 |
| selitysatlas.explanation_components | 10 |
| selitysatlas.generations | 13 |
| selitysatlas.hypotheses | 16 |
| selitysatlas.mechanisms | 14 |
| selitysatlas.meta | 1 |
| selitysatlas.models | 48 |
| selitysatlas.open_issues | 7 |
| selitysatlas.questions | 10 |
| selitysatlas.relations | 206 |
| selitysatlas.sources | 30 |
| selitysatlas.stories | 4 |
| selitysatlas.themes | 87 |
| public.infographics | 288 |
| public.selitysatlas_links | 323 |

## Käynnistys ja varmentaminen
Päähaaraan yhdistetty siirtokoodi/workflow käynnistää kirjoitusajon automaattisesti.
Manuaalisesti Actions → Turso Selitysatlas transfer → Run workflow → main → Write and verify Selitysatlas in Turso.
Samat Actions-salaisuudet kuin aiemmin; vain palvelinavain. Ilman kirjoitusvalintaa tarkistetaan koko lähde mutta kohteeseen ei oteta yhteyttä.
items (1112) ja articles (314) pitää olla aiemmin varmennettu.
Yhteinen concurrency-ryhmä estää päällekkäiset siirrot.

Kohteet ovat selitysatlas__TAULU ja public__infographics / public__selitysatlas_links. Skeemojen samannimiset taulut pysyvät erillään.
Kaikki kentät säilyvät: numeric tarkkana tekstinä, JSON/taulukot JSON-tekstinä, boolit 0/1.
Kohteen olemassa olevat poikkeavat rivit pysäyttävät ajon. Ei korvaamista tai poistamista.
Sivu kirjoitetaan, luetaan takaisin ja verrataan kokonaan. Lopussa tarkistetaan koko kohdesisältö, kaikki yhdeksän tämän kokonaisuuden ilmoitettua vierasavainta ja luetaan lähde uudelleen.
JSON-kenttien sisältä ei päätellä uusia suhteita.
Keskeytyksen jälkeen sama ajo voi alkaa alusta ja käyttää vastaavat rivit uudelleen.
Odotettu loppu: PASS: Selitysatlas and infographic metadata; 1079 rows, all contents and references verified.

Pidä lähde muuttumattomana siirron ajan. REST-haut eivät ole atominen tilannekuva. Sovellus, sen julkaisu ja päivitystoiminnot eivät vaihdu.

## Yksityisen skeeman palvelinluku
migration_selity_page_v1 on tätä siirtoa varten luotu STABLE SECURITY INVOKER -RPC, tyhjällä search_pathilla.
Suoritusoikeus on poistettu PUBLIC-, anon- ja authenticated-rooleilta; vain service_role saa suorittaa. Funktio tarkistaa myös current_user-roolin.
Vain 20 nimettyä taulua sallitaan. SQL-lauseet ovat kiinteät; käyttäjän syötettä ei yhdistetä SQL-tunnisteisiin. Sivukoko 1–500, vain yksiosainen pääavainkursori. Se ei kirjoita lähdetauluihin.
service_role sai USAGE-oikeuden vain selitysatlas-skeemaan ja SELECT-oikeuden sen 18 tauluun. Näitä oikeuksia ei ollut ennen siirtoa. Julkisia tauluoikeuksia tai RLS-sääntöjä ei muutettu.
Funktio ja oikeusmuutokset on toteutettu samassa transaktiossa, jotta julkista suoritusikkunaa ei synny.
SQL-asennus on skriptissä install-selity-reader.sql (on jo suoritettu tässä projektissa). Se ei ole yleinen sovellusmigratio eikä sitä pidä ajaa uudelleen automaattisesti.

Kun PASS on varmennettu eikä uutta lähdetarkistusta tarvita, suorita cleanup-selity-reader.sql ylläpitoyhteydellä. Se poistaa siirtokohtaisen RPC:n ja palauttaa lisätyt palvelinroolin lukuoikeudet aiempaan tilaan. Älä siivoa kesken ajon.
Siivouksen jälkeen automaattinen uudelleenajo edellyttää lukutoiminnon uutta valmistelua.

## Testit
python -m unittest discover -s scripts/migration -p 'test_turso*.py'
Live SQL-testissä kaikki 20 taulua palauttivat palvelinroolilla odotetun määrän. Tarkistettu, ettei funktio ole SECURITY DEFINER eikä anon/authenticated voi suorittaa sitä.
