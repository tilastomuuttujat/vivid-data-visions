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
