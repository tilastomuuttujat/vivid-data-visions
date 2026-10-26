# Institutionaalinen valta: ensimmäinen keruu 1850–1917

Erä `institutional_power_1850_1917_20261026` sisältää 11 laadullista tapausta ja 12 lähteistettyä väitettä. Neljä aiempaa tapahtumakorttia käytetään uudelleen, seitsemän lisätään. Luokitus: päätösvalta, resurssivalta, valmistelu, edustus sekä valvonta/vastuu. Teemakytkennät ovat tapausten JSON-kentässä; uutta 33. teemaa ei luoda.

Muodollinen toimivalta ja sen muutos ovat havaintoja. Epävirallinen vaikutusvalta, osallisten intressit ja yhteiskunnalliset vaikutusmekanismit jäävät tutkimushypoteeseiksi. Lähteenä käytetyt nykyiset viranomais- ja arkistohistoriat erotetaan alkuperäissäädöksistä. Vuoden1906 säädösteksti luettiin Finlexiin viittaavasta jäljennöksestä; Finlexin dynaaminen sivu ei palauttanut koko tekstiä. Vuoden1917 kunnallislainsäädännön tausta tarkistettiin HE155/2006:n hakutulosotteesta, ei vuoden1917 alkuperäistekstistä. Tätä rajatumpaa tarkistustasoa ei koroteta automaattisesti.

Senaatin oikeusosaston 1850–1917 kortti kuvaa keruujaksoon rajattua järjestelyä; 1850 ei ole perustamisvuosi eikä pitkä aikaväli osoita toimivallan olleen muuttumaton vuosittain. Vuoden1917 heinäkuun valtalain hyväksyminen ja torjunta erotetaan marraskuun vallansiirrosta. Vuoden1906 edustus ei tarkoita parlamentaarista hallitusvaltaa. Valtiokonttorin perustaminen, johtokunnan työ ja toiminnan alkaminen erotetaan ajallisesti.

SQL säilyttää erän sisältötunnisteen ja hylkää muuttuneen uudelleentuonnin; sama erä voidaan ajaa uudelleen ilman uusia tapauksia. Muissa erissä tuotuja tapahtumia ei kopioida, niille lisätään tarvittaessa lähdeviitteitä. Tapaukset tallennetaan `atlas_mechanism_cases`-tauluun ja manifesti `dataset_meta`-tauluun. Ei skeema- tai käyttöoikeusmuutoksia, numeerisia vaikutussarjoja tai kausaalisia verkostokaaria.

Tarkistus: `python -m unittest discover -s scripts/data -p 'test_institutional_power_batch.py'`. Aja erän SQL hyväksytyllä tietokantayhteydellä ja tarkista loppukyselyn 11 tapausta / 12 havaintoa / 4 uudelleenkäytettyä / 7 uutta korttia. Tämä keruu ei vielä päivitä verkkonäkymien aiempia staattisia poimintoja.
