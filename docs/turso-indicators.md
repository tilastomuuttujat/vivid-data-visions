# Aikasarjojen ja havaintojen siirto Tursoon

## Rajaus
Tämä tekee erilliset lukukopiot public.indicator_series- ja public.indicator_values-tauluista. Se ei muuta Atlasin julkaisua eikä kirjoita Supabaseen. Nykyinen 32 teeman koesiirto säilyy.

Kohteet ovat public__indicator_series ja public__indicator_values. Kaikki lähdesarakkeet säilyvät. PostgreSQL numeric tallennetaan täsmällisenä TEXT-arvona, JSONB ja taulukot JSON-tekstinä, aikaleimat tekstinä ja totuusarvot 0/1-arvoina. _migration_key on siirron apuavain; alkuperäiset pääavaimet säilyvät. PostgreSQL RLS, triggerit, oletusarvot ja koko ylläpidon toiminta eivät siirry. Kohde ei ole sovelluksen suora korvaaja.

## iPad-ohje
Käytössä ovat jo lisätyt Actions-salaisuudet SUPABASE_READ_KEY ja TURSO_AUTH_TOKEN. Niiden on sallittava kaikkien lähderivien lukeminen ja kohdetietokannan kirjoittaminen.

1. Actions → Turso indicator transfer → Run workflow → main.
2. Valitse indicator_series ja jätä Write and verify in Turso pois päältä. Tämä tarkistaa ensimmäisen 500 rivin otoksen. SAMPLE/PARTIAL ei tarkoita koko aineiston tarkistusta.
3. Uusi ajo samalla taululla, nyt Write and verify in Turso päällä. Odotettu määrä on 2461.
4. Valitse indicator_values, tee ensin otostesti ja sitten kirjoitusajo. Odotettu määrä on 629741.
5. Jos kirjoitusajo katkeaa aikarajaan tai verkkovirheeseen, käynnistä sama kirjoitusajo uudelleen. Tursoon tallennettu eräkirjanpito jatkaa viimeisestä tarkistetusta erästä. Viimeinen erä tarkistetaan uudelleen ennen jatkamista. Älä muuta sivukokoa kesken siirron.

Jokainen uusi erä luetaan takaisin ja verrataan kaikkiin lähdesarakkeisiin ennen edistymisen tallentamista. Olemassa olevaa poikkeavaa riviä ei korvata. Yksi INSERT on atominen; aiempien onnistuneiden erien sisältö jää kohteeseen epäonnistumisessa. Tämä ei ole koko taulun atominen vaihto. Eräkirjanpidon SHA256-manifesti ja rivimäärät tulostetaan lokiin; havaintoja ja avaimia ei tulosteta eikä tallenneta julkisiksi artifakteiksi.

## Lähde ja käyttöoikeudet
Lähdeosoite ja kohdeosoite ovat samat kuin koesiirrossa. Sallittuja tauluja on vain kaksi. Hyväksytyt kokonaismäärät on tarkistettu ylläpitoyhteydellä 2.11.2026. Jokaisen erän koon ja lopussa näkyvän lisärivin puuttumisen pitää vastata hyväksyttyä kokonaismäärää. Koko taulun COUNT-laskentaa ei tehdä REST-haussa. Älä avaa RLS-sääntöjä tämän vuoksi; tarkista avaimen oikeudet tai lähteen muutokset.

Pidä lähdetaulut muuttumattomina ensimmäisen kirjoitusajon alusta valmistumiseen. Havaintojen REST-sivutus käyttää yhdistelmäavainta (series_key, year, group_key) ja sarjakuvaukset offset-sivutusta. Kumpikaan ei ole PostgreSQL:n yhden ajanhetken tilannekuva. Samanaikaiset muutokset voivat vaihtaa sivujen sisältöä kokonaismäärän pysyessä samana. Jatkaminen tarkistaa vain viimeisen erän lähdemuutokset; se ei havaitse kaikkia aiempien erien muutoksia. Jos lähdettä on muutettu, älä jatka vanhaa siirtoa: valmistele uusi versioitu kohde erikseen. Kohteen eräkirjanpitoa tai aiempia rivejä ei pidä muokata käsin.

## Tarkistus
Vihreässä kirjoitusajossa molempien taulujen tulee tulostaa PASS omassa ajossaan. Lopussa tarkistetaan kohteen kokonaismäärä ja havaintojen viittaukset sarjoihin. Koko aiemmin siirrettyä kohdetta ei lueta uudelleen jatkoajossa; aiempien erien onnistuneisiin vertailuihin luotetaan.

Turson SQL-konsolissa:
```sql
SELECT 'sarjat' AS aineisto, count(*) AS riveja FROM public__indicator_series
UNION ALL
SELECT 'havainnot', count(*) FROM public__indicator_values;

SELECT count(*) AS puuttuvia_sarjoja
FROM public__indicator_values v
LEFT JOIN public__indicator_series s ON s.series_key=v.series_key
WHERE s.series_key IS NULL;
```
Odotus: sarjat 2461, havainnot 629741, puuttuvia_sarjoja 0.

## Testit
`python -m unittest discover -s scripts/migration -p 'test_turso_indicators.py'`

Testit käyttävät paikallista SQLite-tietokantaa ja simuloitua HTTP-kuljetusta. Ne tarkistavat keskeytyksestä jatkamisen, toistoajon, sisältöristiriidan, yhdistelmäavaimet, desimaalien ja JSON-lukujen tarkkuuden sekä katkenneen lähdesivun hylkäämisen. Oikean Turson ajot on käynnistettävä Actionsissa.
