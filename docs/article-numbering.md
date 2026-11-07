# Artikkelien yhtenäinen numerointi 1–36

`publication_number` on pysyvä julkaisunumero, joka on erillinen lähdeasiakirjan `source_position`- ja `source_number`-kentistä. Se ei muuta artikkelitunnisteita, tekstejä, revisioita tai aineistokytkentöjä.

Järjestys säilyttää PDF-lähteen järjestyksen ilman kahta arkistoitua rinnakkaistietuetta. Sen jälkeen tulevat neljä erikseen lisättyä tekstiä aiemman JSON-viennin järjestyksessä. Kaikilla 36 aktiivisella artikkelilla on yksi numero; arkistoiduille kaksoiskappaleille ei anneta uutta numeroa.

Numerot tallennetaan `editorial__article_numbers`-tauluun. Numerointia ei muodosteta suodatetun hakutuloksen rivinumeroista, joten haku tai lajittelu ei muuta tunnistettavaa julkaisunumeroa.

`editorial__canonical_articles` sisältää sekä lähdetiedot että yhtenäiset kentät:

- `publication_number`: kokonaisluku 1–36.
- `position`: sama yhtenäinen numero kokonaislukuna.
- `number`: sama numero tekstinä, aiemman JSON-rakenteen yhteensopivuutta varten.
- `source_position`, `source_number`: alkuperäiset lähdetiedot muuttumattomina.

Editorin listaus käyttää julkaisunumeroa ja sen mukaista järjestystä. Julkaisunumeron lisääminen ei tuota uutta tekstirevisiota, joten aiemmat lähdetäydennykset eivät vanhene tämän muutoksen vuoksi.

```sql
SELECT publication_number, id, title, source_position, source_number
FROM editorial__canonical_articles
ORDER BY publication_number;
```

Laajassa JSON-viennissä käytetään `editorial__canonical_articles`-näkymää, `position`- ja `number`-kenttiä sekä kanonisia relaationäkymiä. Täydennykset haetaan esimerkiksi `editorial__canonical_article_evidence_supplements`-näkymästä ehdolla `canonical_article_id = a.id`; `article_id` säilyttää alkuperäisen kytkennän tunnisteen.

Tuonti tarkistaa 36 tunnisteen täsmällisen joukon, numeroiden yksikäsitteisyyden ja katkeamattoman välin 1–36. Kaikki alkuperäiset artikkeli- ja revisiorivit verrataan ennen ja jälkeen. Lopputulos luetaan takaisin uudella tietokantayhteydellä. Uusinta-ajo ei vaihda olemassa olevia numeroita hiljaisesti.
