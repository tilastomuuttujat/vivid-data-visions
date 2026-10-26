# Institutionaalinen valta: ensimmäinen keruu 1850–1917

Erä `institutional_power_1850_1917_20261026` sisältää 11 laadullista tapausta ja 12 lähteistettyä väitettä. Neljä aiempaa tapahtumakorttia käytetään uudelleen, seitsemän lisätään. Luokitus: päätösvalta, resurssivalta, valmistelu, edustus sekä valvonta/vastuu. Teemakytkennät ovat tapausten JSON-kentässä; uutta 33. teemaa ei luoda.

Muodollinen toimivalta ja sen muutos ovat havaintoja. Epävirallinen vaikutusvalta, osallisten intressit ja yhteiskunnalliset vaikutusmekanismit jäävät tutkimushypoteeseiksi. Lähteenä käytetyt nykyiset viranomais- ja arkistohistoriat erotetaan alkuperäissäädöksistä. Vuoden1906 säädösteksti luettiin Finlexiin viittaavasta jäljennöksestä; Finlexin dynaaminen sivu ei palauttanut koko tekstiä. Vuoden1917 kunnallislainsäädännön tausta tarkistettiin HE155/2006:n hakutulosotteesta, ei vuoden1917 alkuperäistekstistä. Tätä rajatumpaa tarkistustasoa ei koroteta automaattisesti.

Senaatin oikeusosaston 1850–1917 kortti kuvaa keruujaksoon rajattua järjestelyä; 1850 ei ole perustamisvuosi eikä pitkä aikaväli osoita toimivallan olleen muuttumaton vuosittain. Vuoden1917 heinäkuun valtalain hyväksyminen ja torjunta erotetaan marraskuun vallansiirrosta. Vuoden1906 edustus ei tarkoita parlamentaarista hallitusvaltaa. Valtiokonttorin perustaminen, johtokunnan työ ja toiminnan alkaminen erotetaan ajallisesti.

SQL säilyttää erän sisältötunnisteen ja hylkää muuttuneen uudelleentuonnin; sama erä voidaan ajaa uudelleen ilman uusia tapauksia. Muissa erissä tuotuja tapahtumia ei kopioida, niille lisätään tarvittaessa lähdeviitteitä. Tapaukset tallennetaan `atlas_mechanism_cases`-tauluun ja manifesti `dataset_meta`-tauluun. Ei skeema- tai käyttöoikeusmuutoksia, numeerisia vaikutussarjoja tai kausaalisia verkostokaaria.

Tarkistus: `python -m unittest discover -s scripts/data -p 'test_institutional_power_batch.py'`. Aja erän SQL hyväksytyllä tietokantayhteydellä ja tarkista loppukyselyn 11 tapausta / 12 havaintoa / 4 uudelleenkäytettyä / 7 uutta korttia. Tämä keruu ei vielä päivitä verkkonäkymien aiempia staattisia poimintoja.

## Jatko 1918–1945

`institutional_power_1918_1945_20261026` sisältää 15 tapausta, 16 lähteistettyä väitettä ja 9 lähdettä. Seitsemän tapahtumakorttia käytetään uudelleen, kahdeksan lisätään. Keruu kattaa tuomioistuinten eriyttämisen, vuoden1918 poikkeuksellisen oikeudenkäyttöjärjestelmän, hallitusmuodon vallanjaon, oikeusasiamiehen, vuoden1930 rajoituksia ja laillisuusvalvontaa, Mäntsälän kapinan, sota-ajan hallintolainkäytön ja resurssihallinnon sekä työmarkkinainstituutioiden vaiheet1940–1945.

Oikeusasiamiehen historiatutkimuksessa kuvattu huomautus Työn Äänen painamisen estämisestä erotetaan huomautuksen vaikutuksesta. Valtiorikosylioikeudelle osoitettu armonanomus ei ole tavallinen muutoksenhaku. Vuoden1919 presidentin vahvistusvaltaa ei tulkita ehdottomaksi vetoksi. KHO:n olemassaolo ei tarkoita yleistä oikeutta valittaa kaikista hallituksen ratkaisuista. Ministeriön olemassaolosta ei päätellä yksittäistä säännöstelyvaltuutta. Vuosi1945 ei ole kansanhuoltoministeriön lakkautusvuosi.

Vuoden1940 neuvottelutunnustus, vuoden1942 hallintoedustus, vuoden1944 yleissopimus ja vuoden1945 palkkasäännöstely ovat eri vaiheita. Näiden lähteenä oleva SAK:n historiakuvaus säilyy osapuolinäkökulmana. Vuoden1945 päätöksen tarkkaa päivää tai numeroa ei tallenneta vahvistamatta sitä alkuperäisasiakirjasta. Poikkeusvaltuuksien alkuperäissäädökset, nimitysvallan käyttö, yksityinen resurssivalta ja valvontakomissio jäävät nimetyiksi jatkotehtäviksi. Lähdetarkistuksen erot (koko teksti vs. hakutulosote) on merkitty lähdekohtaisesti.

Tuonti käyttää samaa sisältötarkistettua erämallia kuin aiempi keruu. Lopputarkistuksen odote:15 tapausta /16 havaintoa /7 aiempaa /8 uutta tapahtumakorttia. Staattisten verkkonäkymien tietopoimintaa ei tässä erässä päivitetä.

## Jatko 1946–1975

`institutional_power_1946_1975_20261026` sisältää 14 tapausta, 15 lähteistettyä väitettä ja 14 lähdettä. Kymmenen olemassa olevaa tapahtumakorttia hyödynnetään, neljä lisätään. Uudet kortit koskevat vuoden 1946 presidentinvalintaa, työtuomioistuimen rakentamista, vuoden 1950 muutoksenhaun laajentamista sekä hajotusvallan dokumentoitujen käyttökertojen koontia. Kytketyt tapaukset käsittelevät lisäksi Yleisradion hallintoa, asiakirjajulkisuutta, eläkehallintoa, sairausvakuutusta, Sitraa, keskitettyä sopimista, peruskoulua, JSN:ää, kansanterveystyön ohjausta ja vuoden 1973 poikkeuslakia.

Ajoitus: työtuomioistuimen laki 1946 / toiminta 1947; Ylen hallintomuutos 1948 / ensimmäinen uusi neuvosto 1949; julkisuuslaki 1951 / voimaantulo 1952; eläkehallinnon rakenne 1961 / TEL ja LEL voimaan 1962; sairausvakuutuslaki 1963 / maksut ja toimeenpano 1964. Peruskoulun kortti päättyy keruurajaan 1975, vaikka valtakunnallinen siirtymä jatkui vuoteen 1977. Hajotuskortin 1953–1975 aikaväli ei ole vuosittainen jatkuva tapahtuma: käyttökerrat ovat 1953, 1961, 1971 ja 1975.

ETK:n hallinnon työmarkkinaedustus erotetaan eläkeyhtiöiden myöhemmästä edustuksesta. Tulopolitiikka ei ole eduskunnan budjetti- tai lainsäädäntövallan siirto järjestöille. Kansanterveystyön kuntatehtävä ja valtakunnallinen suunnittelu erotetaan palvelujen toteumasta. JSN ei ole pakkovaltaa käyttävä tuomioistuin. Nykyisiä hallintorakenteita tai lakimuutoksia ei siirretä takautuvasti.

Suurin osa lähteistä tarkistettiin sivu- tai PDF-tekstistä. Vuoden 1951 julkisuuslain ja vuoden 1979 terveydenhuoltotilaston tiedot tarkistettiin hakutulosotteista; tarkistustaso näkyy lähdemetadatassa. SAK:n lähde on osapuolen historiakuvaus. Tulevat alkuperäisasiakirjojen tarkistukset, nimityskäytännöt, omistusvalta ja paikalliset toteumaerot on nimetty jatkotehtäviksi. Ei uusia numeerisia sarjoja eikä verkkonäkymien staattisen poiminnan päivitystä.

Lopputarkistus: 14 tapausta / 15 väitettä / 10 aiempaa / 4 uutta tapahtumakorttia. Sama erä voidaan tuoda uudelleen ilman uusia rivejä; muuttunut payload hylätään. Sama luokitus ja tarkistustestit kuin aiemmissa erissä.
