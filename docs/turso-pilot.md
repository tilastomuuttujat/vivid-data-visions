# Turso-koesiirto iPadilta

Tämä käsin käynnistettävä työnkulku kopioi vain murrosmatriisin public.atlas_themes-taulun Turson public__atlas_themes-tauluun. Se ei siirrä koko tietokantaa, käyttöoikeuksia, funktioita tai sovelluksen tietoyhteyksiä. Supabaseen ei kirjoiteta.

## Valmistelu
Yhdistä tämä PR main-haaraan. Avaa repossa Settings → Secrets and variables → Actions → New repository secret.
- SUPABASE_READ_KEY: Supabasen avain, jonka roolilla on SELECT-oikeus kaikkiin atlas_themes-riveihin. Julkinen avain toimii vain, jos nykyiset käyttöoikeudet sallivat sen. Älä avaa RLS-sääntöjä siirron vuoksi. Jos käytät service_role-avainta, se on erittäin laaja palvelinavain: säilytä se vain Actions-salaisuutena ja poista koesiirron jälkeen.
- TURSO_AUTH_TOKEN: vain kohdetietokannan kirjoittamisen salliva käyttöavain. Aseta lyhyt voimassaoloaika.

Älä lisää avaimia lähdekoodiin, keskusteluun tai VITE_-muuttujiin. Lähde- ja kohdeosoitteet on rajattu skriptiin. Vaihda niitä vain tarkistetulla koodimuutoksella.

## Ajo
Actions → Turso atlas themes pilot → Run workflow.
1. Jätä apply pois päältä. Ajo tarkistaa lähteen ja sen tarkan rivimäärän ottamatta yhteyttä Tursoon.
2. Valitse apply. Ajo luo kohteen ja lisää puuttuvat rivit transaktiossa; olemassa olevia rivejä ei korvata. Kaikkien kohderivien on vastattava lähdettä ennen COMMITia. Uusi yhteys tarkistaa tiedot vielä tallennuksen jälkeen.
3. Vihreä ajo ja lokin "Pilot committed and verified" vahvistavat onnistumisen.

Jos sisältö on muuttunut aiemman siirron jälkeen, ajo epäonnistuu turvallisesti: tämä ei ole päivitys- tai synkronointityökalu. Tyhjää tai yli 1000 rivin lähdettä ei siirretä. Lähteen samanhetkiset muutokset ajon jälkeen eivät sisälly lukukopioon. Turson lyhyt transaktion aikaraja voi keskeyttää ajon; koesiirron voi uusia. Verkkovirhe COMMITin aikana voi jättää lopputilan epäselväksi: uusi ajo tarkistaa saman sisällön idempotentisti.

Skripti käyttää Pythonin standardikirjastoa, Supabasen REST-rajapintaa ja Turson HTTP v2 pipelinea. Raakasisältöä tai avaimia ei tulosteta eikä tallenneta Actions-artifakteiksi. Älä suorita muutetun tai epäluotetun haaran koodia näillä salaisuuksilla.

## Rajaus
Tämä on erillinen lukukopio. Atlasin julkaistu sovellus käyttää edelleen nykyistä tietolähdettään. Lähderoolin RLS:n piilottamia rivejä REST-rajapinta ei voi havaita: vertaa ilmoitettua rivimäärää ylläpidon tuntemaan kokonaismäärään ennen jatkosiirtoa.
