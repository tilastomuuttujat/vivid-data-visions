# Korttien suhteiden ja Painekartan siirto

GitHub Actions → Turso network transfer → Run workflow → main → valitse Write and verify relations and pressure map in Turso → Run workflow.

Taulut: relations 595, painekartta_nodes 313, painekartta_edges 595. Yhteensä 1503 riviä. Samat SUPABASE_READ_KEY ja TURSO_AUTH_TOKEN -salaisuudet. Aiemman Atlas-siirron tulee olla valmis.
Ilman kirjoitusvalintaa tehdään vain lähteen tarkistus. Sama concurrency-ryhmä estää päällekkäiset siirrot.

Insert-only: olemassa olevat vastaavat rivit käytetään uudelleen, ristiriitaisia ei korvata. Uudelleenkäynnistys tarkistaa lähteen alusta; havaintosiirron jatkokohtiin ei kosketa.
Kaikki lähdekentät säilyvät. Numeeriset arvot tallennetaan täsmällisenä tekstinä, boolit 0/1, taulukot JSON-tekstinä. Ei suunnan kääntämistä tai uusien suhteiden päättelyä.
Koko lähde luetaan ennen kirjoituksia ja uudelleen lopussa. Kohteen koko sisältö ja kaikki tämän vaiheen ilmoitetut vierasavaimet verrataan.
Pidä lähde muuttumattomana. REST-haut eivät muodosta atomista tilannekuvaa.
Lokin lopussa tulee olla PASS: Relations and pressure map, all contents and references verified.

Sovelluksen yhteydet ja tietojen julkaisu eivät vaihdu tässä vaiheessa. Painekartta on olemassa olevan laskentatuloksen lukukopio, ei Tursoon siirretty päivitysprosessi. PostgreSQL-triggerit, uniikki- ja CHECK-säännöt sekä RLS eivät siirry automaattisesti.
Inventaario: [turso-inventory.md](turso-inventory.md).
