# Sisällön ja metatietojen siirto Tursoon

## Käynnistys
GitHub Actions → Turso content transfer → Run workflow → main.
Valitse **Write and verify content and metadata in Turso** → Run workflow.
Samat SUPABASE_READ_KEY ja TURSO_AUTH_TOKEN -salaisuudet; palvelinavaimen pitää nähdä myös julkaisemattomat rivit. Älä muuta RLS-sääntöjä.
Aiempi Atlas-siirto tulee olla valmis. Yhteinen concurrency-ryhmä estää samanaikaiset siirrot.
Ilman kirjoitusvalintaa ajo tarkistaa vain lähteen.

## Rajaus
Yhdeksän taulua, 1322 riviä. Lähteen tarkat määrät tarkistettu 4.11.2026.

| Taulu | Rivejä |
|---|---:|
| article_dataset_meta | 1 |
| article_links | 436 |
| article_relation_types | 5 |
| articles | 314 |
| attachments | 221 |
| dataset_meta | 285 |
| indicator_aliases | 12 |
| statistic_series | 12 |
| statistic_values | 36 |

Kohdenimet public__ + taulun nimi. Artikkelien koko tekstisisältö, taulukot ja kaikki metatietokentät säilyvät. Numeeriset arvot tallennetaan täsmällisenä tekstinä.
attachments sisältää tiedostopolkuja ja kuvatekstejä: tämä ei siirrä itse tiedostoja eikä varmista niiden saatavuutta. Tallennuspalvelun tiedostot ja niiden linkit on inventoitava ennen lähdepalvelusta luopumista.
infographics on jätetty myöhempään vaiheeseen, koska se viittaa Selitysatlaksen teemoihin, malleihin, sukupolviin ja mekanismeihin.
Yhdistys-, maksu- ja käyttäjähallinta eivät kuulu tähän siirtoon.

## Varmennus ja uudelleenkäynnistys
Kaikki lähdetaulut luetaan ennen kirjoituksia. Odotettu määrä, pääavaimet ja kentät tarkistetaan. Poikkeava kohderivi pysäyttää ajon; rivejä ei korvata tai poisteta.
Kaikki kirjoitetut erät luetaan takaisin. Lopussa kohteen kokonaismäärä ja koko sisältö tarkistetaan pienissä erissä, samoin kaikki kahdeksan tämän vaiheen ilmoitettua vierasavainta.
Lähde luetaan uudelleen ennen PASS-merkintää muutosten havaitsemiseksi.
Pidä lähde muuttumattomana: REST ei ole atominen tietokannan tilannekuva.
Keskeytyksen jälkeen sama ajo voi alkaa alusta ja käyttää vastaavat kohderivit uudelleen. Havaintosiirron eräkirjanpitoa ei muuteta.
Odotettu loppurivi: **PASS: Content and metadata, all contents and references verified.**

Tämä on lukukopio. Sovelluksen yhteydet, julkaisu, RLS, triggerit, ylläpito ja tiedostopalvelu eivät vaihdu tässä vaiheessa.
Inventaario: [turso-inventory.md](turso-inventory.md).

## Testaus
python -m unittest discover -s scripts/migration -p 'test_turso*.py'

## Suurten metatietorivien korjaus 4.11.2026
Lähteen dataset_meta-taulussa on kolme yli 512 KiB:n JSON-riviä; suurin data::text on 1131139 tavua. Alkuperäinen ajo pysähtyi ennen niiden kirjoittamista siirtokoodin kokorajaan.
Sisältösiirto sallii nyt enintään 4 MiB:n rivikohtaiset JSON-koodatut argumentit. Yli 512 KiB:n rivit lähetetään kukin omalla atomisella INSERT-lauseellaan, tavalliset rivit edelleen pienissä erissä. Kokoa mitataan HTTP-kuljetuksen JSON-escapet huomioiden. Sisältöä ei pilkota, typistetä tai korvata tiivisteellä. Liian suuri rivi hylätään ennen kyseisen sivun kirjoituksia.
Muiden siirtojen oletusraja pysyy 512 KiB:ssa. Sisältö- ja ristiriitavertailut ovat ennallaan.
Käynnistä korjauksen jälkeen **uusi Run workflow → main**; vanhan ajon Re-run käyttää vanhaa koodia. Aiemmin varmennetut 314 artikkelia, viisi suhdetyyppiä ja yksi artikkelimetarivi käytetään uudelleen.
