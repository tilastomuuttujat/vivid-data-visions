# Arviointikartan lukukopio Tursoon

5 taulua, 2176 riviä. Tarkistettu lähteestä 4.11.2026:
- matrices: 1
- lens_baselines: 1080
- lens_aggregate: 1080
- excluded: 2
- overrides: 13

Kohteet arviointi__TAULU. Kaikki lähdesarakkeet säilyvät. Numeeriset koontiarvot ovat täsmällistä tekstiä, UUID/päivät/aikaleimat tekstiä ja boolit 0/1.
Matriisin user_id säilyy alkuperäisenä tunnisteena. Lähteessä tarkistettiin yksi omistaja ja nolla puuttuvaa auth.users-vastinetta.
Auth-tilejä, salasanoja, istuntoja tai kirjautumisen toiminnallisuutta ei kopioida. Tätä ulkoista auth.users-viittausta ei väitetä kohteessa toteutetuksi; omistajatunnisteiden ja tulevan kirjautumisen kytkentä on käyttöönottotehtävä.
Neljä skeeman sisäistä vierasavainta tarkistetaan kokonaan, myös phenomenon_id/lens_id-yhdistelmät.

## Käynnistys
Päähaaraan yhdistetty koodi/workflow käynnistää kirjoitusajon. Manuaalisesti Actions → Turso Arviointi transfer → Run workflow → main → Write and verify Arviointi in Turso.
Samat SUPABASE_READ_KEY ja TURSO_AUTH_TOKEN, vain palvelinavain. Ilman kirjoitusvalintaa tarkistetaan koko lähde mutta kohteeseen ei oteta yhteyttä.
Yhteinen concurrency-ryhmä estää päällekkäiset siirrot.

Koko lähde luetaan ennen kirjoituksia. Insert-only: olemassa olevat vastaavat rivit käytetään uudelleen, ristiriitaisia ei korvata tai poisteta.
Kaikki erät luetaan takaisin ja koko kohdesisältö sekä määrät verrataan. Lopussa koko lähde luetaan uudelleen muutosten havaitsemiseksi.
Keskeytyksen jälkeen pieni siirto voi alkaa alusta; vastaavat kohderivit säilyvät käytössä. Muiden siirtojen kirjanpitoon ei kosketa.
Pidä lähde muuttumattomana. REST ei muodosta atomista tilannekuvaa.

Odotettu loppu:
PASS: Arviointi complete; 5 tables, 2176 rows, all contents and 4 internal references verified.

Sovelluksen yhteydet, käyttäjäkohtaiset käyttöoikeudet, RLS, triggerit ja laskentaprosessit eivät vaihdu tässä vaiheessa.

## Siirtokohtainen palvelinlukija
migration_arviointi_page_v1 on STABLE SECURITY INVOKER tyhjällä search_pathilla, vain service_role saa suorittaa. current_user tarkistetaan. PUBLIC-, anon- ja authenticated-suoritusoikeudet poistettiin samassa transaktiossa.
Vain viisi kiinteää taulua sallitaan, kurso­rit annetaan parametrisoituina JSON-arvoina ja UUID-avaimet verrataan UUID-tyyppisinä. Sivukoko 1–500.
Lisättiin service_role-roolille arviointi-skeeman USAGE ja viiden taulun SELECT, joita sillä ei aiemmin ollut. Julkisia käyttöoikeuksia tai RLS-sääntöjä ei muutettu.
install-arviointi-reader.sql on jo suoritettu lähdeprojektissa. Kun PASS on vahvistettu, cleanup-arviointi-reader.sql poistaa RPC:n ja palauttaa tässä lisätyt oikeudet aiempaan tilaan. Älä siivoa kesken ajon.
Siivouksen jälkeen uusi ajo vaatii lukijan uuden valmistelun.

## Validointi
Kaikki 55 paikallista migraatiotestiä läpäisivät, mukaan lukien kokonaisajon uudelleenkäynnistys, omistajatunniste, desimaalitarkkuus, lähteen muuttuminen, kohderistiriita ja yhdistelmäviittaus.
Palvelinroolilla kaikki viisi ensimmäistä sivua vastasivat odotettua.
SECURITY DEFINER=false, anon/authenticated EXECUTE=false, service_role EXECUTE=true.
