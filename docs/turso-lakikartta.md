# Lakikartan sekä kortti- ja simulaattorikytkentöjen siirto

## Rajaus
Lähdemäärät tarkistettu 4.11.2026. Lakikartta: 82 taulua, 95891 riviä. Public-riippuvuudet: 9 taulua, 863 riviä. Yhteensä **91 taulua, 96754 riviä**. Mukana ovat myös 27 tyhjää lähdetaulua.
Sisältää lait ja pykälät, historialliset lakitapahtumat, ministeripestit, valtionyhtiöt, luokitukset ja tutkimuskytkennät sekä korttien lakikytkennät ja simulaattorin lähtöarvot/parametrit.
Research- ja arviointi-skeemat, kuva- ja liitetiedostot sekä sovelluksen käyttöönotto jäävät seuraaviin vaiheisiin.
Kohteet lakikartta__TAULU ja public__TAULU. Näkymät eivät kuulu kopioon; simulaattorin effect_matrix-näkymää ei esitetä siirretyksi.

## Käynnistys ja jatkaminen
Päähaaraan yhdistetty siirtokoodi/workflow käynnistää kirjoitusajon. Sama concurrency-ryhmä kuin muilla Turso-siirroilla.
Manuaalisesti Actions → Turso Lakikartta transfer → Run workflow → main → **Write and verify Lakikartta in Turso**.
Samat SUPABASE_READ_KEY ja TURSO_AUTH_TOKEN. Ilman kirjoitusvalintaa luetaan ensimmäinen lähderivi jokaisesta taulusta; SAMPLE/PARTIAL ei tarkoita kokosiirtoa.
Vanhempina pitää olla aiemmin varmennetut items 1112 ja indicator_series 2461.

Kopiointi on insert-only. Vastaavat rivit käytetään uudelleen, poikkeavia ei korvata tai poisteta.
Kaikki lähdesarakkeet säilyvät: numeric sekä PostgreSQL:n viemät liukulukuesitykset tallennetaan tekstinä, JSON ja taulukot tarkkana JSON-tekstinä, boolit 0/1, päivät ja aikaleimat tekstinä.
500 rivin sivut verrataan kenttä kentältä ja luetaan takaisin ennen jatkokohdan tallennusta.
_lakikartta_transfer_pages_v1 pitää samalla rivillä sivun alku-/loppukursorin, määrät, asetukset ja SHA256-tiivisteen.
Jatkoajo tarkistaa viimeisen lähde- ja kohdesivun ennen jatkamista. Aiempiin onnistuneisiin sivuvertailuihin luotetaan; koko aiempaa lähdettä ei lueta uudelleen.
Jos 90 minuutin aikabudjetti täyttyy, ajo tulostaa PARTIAL ja päättyy koodiin 2; workflow-raja on 120 minuuttia. Käynnistä sama kirjoitusajo uudelleen. Aiemmat erät säilyvät.
Verkkovirheestä voi jatkaa samoin. Älä muuta sivukokoa, kokonaismääriä tai kirjanpitoa käsin.

## Pääavaimettomat taulut
33 taululla ei ole alkuperäistä pääavainta; kuusi niistä sisältää rivejä.
Niitä ei deduplikoida eikä niille keksitä sisällöllistä tunnistetta.
Lukija järjestää kokonaiset rivit to_jsonb(rivi)::text COLLATE C -esityksen mukaan ja antaa _source_row_ordinal-apujärjestysnumeron.
Identtiset rivit säilyvät erillisinä järjestysnumeroina. NULL-kentät säilyvät NULL-arvoina.
Apunumero on siirtotekninen eikä alkuperäisen aineiston pysyvä tunniste.
Pidä lähde muuttumattomana ensimmäisestä ajosta valmistumiseen: rivin lisäys/poisto voi siirtää järjestysnumeroita.
Pääavaimellisissa tauluissa käytetään alkuperäisen yhdistelmäavaimen indeksiin sopivaa PostgreSQL:n rivivertailua. Avaimet annetaan JSON-parametreina; niitä ei yhdistetä SQL-lauseisiin.

## Valmistuminen
Kunkin taulun lopussa tarkistetaan lähteen loppuminen ja kohteen tarkka kokonaismäärä.
Kaikki **54 ilmoitettua vierasavainta** tarkistetaan, myös yhdistelmäviittaukset. MATCH SIMPLE -viittauksessa osittainen NULL ohitetaan kuten PostgreSQL:ssä.
Lokin viimeisen rivin pitää olla:
PASS: Lakikartta complete; 91 tables, 96754 rows and all 54 declared references verified.

Tämä ei ole atominen PostgreSQL-tilannekuva. Samanaikaisia lähdemuutoksia ei tueta. Jos lähde muuttuu, valmistele uusi versioitu kohde; älä nollaa kirjanpitoa tai ohita sisältövertailua.
Triggerit, näkymät, RLS, muut CHECK/UNIQUE-säännöt, sovelluksen yhteydet ja päivitystoiminnot eivät siirry automaattisesti.

## Palvelinlukija ja oikeuksien palautus
migration_lakikartta_page_v1 on STABLE SECURITY INVOKER -RPC, tyhjä search_path.
Vain service_role voi suorittaa; PUBLIC-, anon- ja authenticated-oikeudet on poistettu samassa transaktiossa. current_user tarkistetaan myös funktion sisällä.
Vain 91 kiinteästi sallittua taulua. Sivukoko 1–500. Funktio ei kirjoita aineistotauluihin, SQL-lauseisiin ei yhdistetä kutsujan tunnisteita.
Asennus lisäsi service_role-roolille lakikartta-skeeman USAGE-oikeuden ja SELECT-oikeuden 60 tauluun, joista se aiemmin puuttui. Muiden 22 taulun aiemmat SELECT-oikeudet säilyvät.
RLS:ää tai tavallisten käyttäjien oikeuksia ei muutettu.
install-lakikartta-reader.sql on jo suoritettu lähdeprojektissa; älä suorita automaattisesti uudelleen.
Kun PASS on vahvistettu eikä uutta lukua tarvita, cleanup-lakikartta-reader.sql poistaa RPC:n ja palauttaa vain tässä vaiheessa lisätyt oikeudet. Älä siivoa ajon ollessa käynnissä. Siivouksen jälkeen uusi ajo vaatii palvelinlukijan uuden valmistelun.

## Tarkistukset
Kaikki 43 paikallista migraatiotestiä läpäisivät.
Live-SQL: kaikki 91 ensimmäistä sivua vastasivat odotettuja määriä; suurimman taulun kaksi sivua sisälsivät 1000 avainta, jotka vastasivat suoraa SQL-hakua.
Kaikkien kuuden rivejä sisältävän pääavaimettoman taulun kaikki rivit vastasivat suoraan lähdetaulujen sisältöä (apujärjestysnumero pois lukien).
Lukijalla SECURITY DEFINER=false, anon/authenticated EXECUTE=false, service_role EXECUTE=true. Tietoturvaneuvot tarkistettu.

## Taulut
| Lähde | Rivejä |
|---|---:|
| lakikartta.amendment_parents | 0 |
| lakikartta.asetus_authority | 0 |
| lakikartta.assessment_cases | 9 |
| lakikartta.assessment_frameworks | 1 |
| lakikartta.assessment_sections | 72 |
| lakikartta.assessment_sources | 28 |
| lakikartta.claim_statute_link | 0 |
| lakikartta.co_amendments | 0 |
| lakikartta.cofog | 69 |
| lakikartta.cofog_mapping | 0 |
| lakikartta.committee_he_link | 0 |
| lakikartta.committee_scrutiny | 16 |
| lakikartta.core_amendment_parents | 157 |
| lakikartta.core_change_intensity | 54 |
| lakikartta.core_co_amendments | 1025 |
| lakikartta.core_co_amendments_sync_stage | 75 |
| lakikartta.core_coupling_summary | 54 |
| lakikartta.core_delegation_depth | 54 |
| lakikartta.core_he_statute_link | 180 |
| lakikartta.core_successors | 61 |
| lakikartta.dataset_inventory | 38 |
| lakikartta.delegation_drift_scale | 0 |
| lakikartta.delegations | 0 |
| lakikartta.edges | 0 |
| lakikartta.editorial_notes | 0 |
| lakikartta.expert_org_he_link | 0 |
| lakikartta.expert_org_scrutiny | 0 |
| lakikartta.expert_person | 0 |
| lakikartta.expert_person_he_link | 0 |
| lakikartta.he_capital_coverage | 0 |
| lakikartta.he_claims | 0 |
| lakikartta.he_he_refs | 0 |
| lakikartta.he_nodes | 0 |
| lakikartta.he_scrutiny | 0 |
| lakikartta.he_signatories | 0 |
| lakikartta.he_statute_link | 0 |
| lakikartta.historical_card_reviews | 316 |
| lakikartta.historical_legal_events | 101 |
| lakikartta.historical_office_people | 200 |
| lakikartta.historical_office_reviews | 3 |
| lakikartta.historical_office_terms | 381 |
| lakikartta.historical_statute_snapshots | 2335 |
| lakikartta.import_jobs | 1 |
| lakikartta.institution_statute_edges | 54 |
| lakikartta.institutions | 22 |
| lakikartta.item_statute_evidence | 287 |
| lakikartta.item_statute_reviews | 108 |
| lakikartta.mapping | 0 |
| lakikartta.ministerial_appointments | 1682 |
| lakikartta.ministerial_governments | 77 |
| lakikartta.ministerial_import_reviews | 45 |
| lakikartta.ministerial_import_sources | 4 |
| lakikartta.ministerial_people | 634 |
| lakikartta.ministry_he_profile | 13 |
| lakikartta.momentit | 0 |
| lakikartta.procurement | 13 |
| lakikartta.signatory_profile | 0 |
| lakikartta.societal_concept_coverage | 1817 |
| lakikartta.societal_concept_series | 6028 |
| lakikartta.societal_concepts | 42 |
| lakikartta.societal_mapping_runs | 12 |
| lakikartta.societal_series_inventory | 67843 |
| lakikartta.source_meta | 13 |
| lakikartta.state_enterprise_events | 137 |
| lakikartta.state_enterprise_ownership | 133 |
| lakikartta.state_enterprise_reviews | 11 |
| lakikartta.state_enterprise_sources | 23 |
| lakikartta.state_enterprises | 134 |
| lakikartta.statute_arc_links | 14 |
| lakikartta.statute_catalog | 2551 |
| lakikartta.statute_documents | 453 |
| lakikartta.statute_first_degree | 1768 |
| lakikartta.statute_funding_rules | 52 |
| lakikartta.statute_network_summary | 54 |
| lakikartta.statute_provisions | 5937 |
| lakikartta.statute_research_metrics | 490 |
| lakikartta.statute_retrieval_attempts | 106 |
| lakikartta.statute_system_weight | 50 |
| lakikartta.statutes | 0 |
| lakikartta.statutes_core | 54 |
| lakikartta.successors | 0 |
| lakikartta.tae_texts | 0 |
| public.item_execution_depth | 22 |
| public.item_institutional_weight | 22 |
| public.item_statute_candidates | 123 |
| public.item_statute_links | 292 |
| public.item_structural_risk | 22 |
| public.simulation_indicator_baselines | 312 |
| public.simulation_normalization_params | 12 |
| public.simulation_statute_effects | 46 |
| public.simulation_statute_levers | 12 |
