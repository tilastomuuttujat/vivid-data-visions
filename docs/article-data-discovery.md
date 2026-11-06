# Artikkelien historiallisen aineiston keruu

Ensimmäinen rajattu keruu (6.11.2026) hyödyntää Turson siirrettyä aineistoa kahden artikkelin työn/tuotannon sekä valtion toiminnan historiallisissa jaksoissa. Haku käy läpi koko indikaattoriluettelon, valitsee julkaistut otsikon tai kuvauksen aiheosumat ja profiloi vain julkaistut havaintorivit vuosilta 1850–1975. Luettelon ilmoittamaa alkuvuotta ei käytetä todellisen kattavuuden korvikkeena.

Keruu säilyttää sarjatunnisteet, määritelmät, yksiköt, maantieteen, ryhmäavaimet ja nimikkeet, todelliset tallennetut vuodet, rivi- ja ei-NULL-määrät, arvotyypit, validointimerkinnät sekä sarja- ja havaintokohtaiset lähdeviitteet versioineen. Puuttuvia vuosia ei täytetä. Ei-NULL ei osoita numeerisuutta tai lähteen oikeellisuutta. Harvat vuosipisteet eivät muutu jatkuvaksi sarjaksi; ryhmät voivat olla päällekkäisiä. Eri lukuerien keruu ei ole yhtä atomista koko tietokannan otosta.

Julkaistujen historiallisten tapahtumien aiheosumat ja niiden olemassa olevat lähdeviitteet tallennetaan myös ehdokkaiksi. Sanahaku tuottaa vääriä osumia ja voi jättää relevantteja termejä ulkopuolelle: tämä ei ole tietokannan kaiken aineiston kattavuusarvio.

`editorial__article_data_discoveries` sisältää versioidut artikkelikohtaiset raportit, artikkelirevision ja tekstitiivisteen. Lähde- ja artikkelitaulut säilyvät muuttumattomina. Ristiriitainen uusinta samalla versiolla estetään ja tallennus luetaan takaisin uudella yhteydellä. Raportti kulkee avustajalle salattuna ja näkyy editorin analyysikerroksessa. Vain koontimäärät tulostetaan julkiseen ajolokiin.

Kaikki löydökset ovat `candidate_only` / `not_assessed`: ne eivät automaattisesti vähennä puutelistan tehtäviä tai vahvista kausaalisia ketjuja. Seuraava työ on valita täsmälliseen artikkeliväitteeseen sopivat sarjat, tarkistaa alkuperäislähde ja mittarin rajaus, laskea kuvailevat havainnot sekä tallentaa hyväksytty väite–sarja–havaintoyhteys erikseen. Uutta ulkoista aineistoa kerätään vasta tarpeen mukaan.
