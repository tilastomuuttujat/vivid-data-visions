# Artikkelien kaksoiskappaleiden yhdistäminen

Versio: `article-consolidation-2026-11-07-v1`.

| Säilytettävä artikkeli | Kanoninen tunniste | Arkistoitu rinnakkaistunniste |
|---|---|---|
| Kun kaikkia lupauksia ei voi toteuttaa | `0cb96576-dc1f-59e5-903e-f1758c3fcef0` | `a3c8712d-95be-514c-8a71-6c784a0e0d9d` |
| Itsenäinen, mutta ei yksin | `88ed3934-0187-5858-af29-cc237735ef7e` | `6f4ef8d2-75d4-55c3-802d-f05cb806ed9f` |

Ensimmäisen parin tekstit ovat täsmälleen samat. Toisessa säilytetään aikaisempi, laajempi teksti pääartikkelina; lyhyempi rinnakkaisteksti säilyy kokonaisena arkistossa. Uutta yhdistelmätekstiä tai uutta tulkintaa ei tuoteta.

## Säilytys ja käyttö

Yhdistäminen on häviötön ja looginen: 38 alkuperäisestä tietueesta muodostuu 36 artikkelin aktiivinen kirjasto ja kaksi arkistoitua rinnakkaistietuetta. Vanhoja pysyviä tunnisteita, alkuperäisiä tekstejä tai viittauksia ei poisteta. Fyysinen `editorial__articles` säilyttää 38 historiatietuetta; `editorial__canonical_articles` ja editorin `editorial__article_catalog` näyttävät 36 artikkelia.

`editorial__article_merges` tallentaa alkuperäisen tietueen, sen kaikki artikkelitunnisteella kytketyt relaatiot ja tekstikatkelmien tarkistustulokset ennen arkistointia. Arkistointitapahtuma lisää normaalin muutosrevision; vanhoja revisioita ei muuteta. Yhdistettyä rinnakkaistietuetta ei voi myöhemmin muokata aktiiviseksi erilliseksi artikkeliksi. Sen sijaan muokataan kanonista tietuetta.

`editorial__article_membership` yhdistää jokaisen alkuperäisen tunnisteen kanoniseen artikkeliin. `editorial__canonical_*`-relaationäkymät säilyttävät **kaikki** alkuperäiset rivit ja lisäävät `canonical_article_id`-sarakkeen. Esimerkiksi:

```sql
-- Aktiivisen kirjaston artikkelit:
SELECT * FROM editorial__canonical_articles;

-- Molempien alkuperäisten tietueiden kaikki täydennysversiot:
SELECT * FROM editorial__canonical_article_evidence_supplements
WHERE canonical_article_id = '0cb96576-dc1f-59e5-903e-f1758c3fcef0';

-- Vastaavasti lakikytkennät, aikakausianalyysit ja arviot:
SELECT * FROM editorial__canonical_article_legal_links;
SELECT * FROM editorial__canonical_period_analyses;
SELECT * FROM editorial__canonical_claim_reviews;
```

Relaationäkymissä `article_id` on edelleen alkuperäinen tunniste. Kytkennät haetaan `canonical_article_id`-sarakkeella. Vanha suora `WHERE article_id = ...` ei yksin kata rinnakkaistietueen aineistoa. Näkymät sisältävät myös historiallisen aineiston; uusimman version valinta tehdään alkuperäisen artikkelitunnisteen ja täydennystunnisteen sisällä, ei yhdistämällä eri alkuperien samannimisiä rivejä.

## Editori ja näytön rajat

Editorissa näkyy yksi artikkeli kummastakin parista. Analyysikerros kokoaa täydennykset molemmista alkuperistä. Täsmälleen sama sisältö esitetään kerran ja molemmat alkuperät ilmoitetaan; erilaiset samannimiset kortit säilytetään erillisinä.

Rinnakkaistekstin täydennys voidaan näyttää nykyiseen tekstiin sopivana vain, jos sen alkuperäinen revisio ja tekstitiiviste täsmäävät, katkelma löytyy normalisoidusti päätekstistä ja päätekstin revisio vastaa yhdistämishetkeä. Muuten kortti näkyy tarkistettavana ja jää matriisin ajantasaisen näytön ulkopuolelle. Kytkentää ei hyväksytä lähdetutkimukseksi tai kausaalivaikutukseksi yhdistämisen perusteella. Erillinen arvio pysyy alkuperäisessä lähdeversiossaan.

Editorin analyysiosiossa on myös avattava alkuperäinen rinnakkaisteksti ja JSON-lataus koko yhdistämisarkistolle: kaikki vanhat artikkelikohtaiset relaatiot sekä alkuperäinen tietue. Lähdeasiakirjat, lakiankkurit ja yhteiset lähdeaineistot jäävät alkuperäisiin tauluihin muuttumattomina.

## Varmennus

Muutos tehdään yhdessä transaktiossa. Odottamaton tekstimuutos keskeyttää molempien parien yhdistämisen. Tuonti varmistaa tekstien ja kaikkien vanhojen artikkelirelaatioiden säilymisen, uuden katalogin yksikäsitteisyyden, kanonisten relaationäkymien täydellisyyden ja idempotentin uusinta-ajon. Tulos luetaan vielä uudella tietokantayhteydellä. Muutos ei poista yhtään alkuperäistä artikkelitietuetta.
