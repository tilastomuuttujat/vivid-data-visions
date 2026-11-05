# Artikkelien aikakausianalyysit

Yksityinen `editorial__period_analyses` säilyttää erilliset tulkinnalliset analyysit. Artikkelien `summary` ja alkuperäinen teksti eivät muutu. Kukin analyysi sidotaan artikkelin tunnisteeseen, revisioon ja tekstin SHA-256-tiivisteeseen. Menetelmäversio ja tallennusaika mahdollistavat myöhemmän uudelleenanalyysin alkuperäistä analyysiä korvaamatta.

Jokainen aikakausimerkintä sisältää alku- ja loppuvuoden, aikakauden nimen, 2–8 avainkäsitettä, kuvatun mekanismin sekä artikkelin omaan tekstiin palautuvan katkelman. Ajoitus erotellaan: `explicit` = tekstissä tai jakson otsikossa annettu, `interpreted` = tulkinnallinen rajaus, `undated` = teksti ei anna tarkkaa ajanjaksoa, `future_scenario` = tulevaisuusvaihtoehto. Tulevaisuuden avoin alkuvuosi ja ajoittamattomat vuodet ovat NULL-arvoja. Vuosiväli ei merkitse vuosittaista havaintosarjaa; rinnakkaiset ja päällekkäiset jaksot ovat mahdollisia.

Analyysit ovat `proposed`-tilassa: ne ovat avustettuja tulkintoja artikkelin sisällöstä, eivät historiallisten väitteiden riippumatonta lähdevarmennusta. Myös mekanismit ovat artikkelien esittämiä yhteyksiä, eivät tällä luokittelulla todistettuja vaikutuksia. Alkuperäislähdetyön puutteet säilyvät artikkelissa.

`editorial__period_terms` avaa aikakaudet ja avainkäsitteet hakukelpoisiksi riveiksi. Näkymä käyttää vain viimeisintä analyysiä ja vain, jos artikkelin revisio vastaa analysoitua versiota. Muokatut artikkelit tarvitsevat uuden analyysin, jotta vanhoja merkintöjä ei esitetä ajantasaisina.

```sql
SELECT a.title,t.year_start,t.year_end,t.period_label,t.dating,t.keyword,t.mechanism
FROM editorial__period_terms t
JOIN editorial__articles a ON a.id=t.article_id
ORDER BY a.title,t.year_start,t.period_label,t.keyword;
```

Yksityinen siirtotyö käyttää vain salattuja paketteja julkisessa GitHub-repositoriossa. Tunnisteet ja artikkelitekstit eivät päädy työn lokiin. Tuonti tarkistaa koko kirjaston kattavuuden, muuttumattoman lähdetekstin ja revision sekä katkelmien vastaavuuden ennen yhtenäistä transaktiota. Samalla menetelmäversiolla tehty toisto on idempotentti; muutettu analyysi tarvitsee uuden menetelmäversion.
