# Artikkelien historiallisen aineiston keruu

Ensimmäinen rajattu keruu (6.11.2026) hyödyntää Turson siirrettyä aineistoa kahden artikkelin työn/tuotannon sekä valtion toiminnan historiallisissa jaksoissa. Haku käy läpi koko indikaattoriluettelon, valitsee julkaistut otsikon tai kuvauksen aiheosumat ja profiloi vain julkaistut havaintorivit vuosilta 1850–1975. Luettelon ilmoittamaa alkuvuotta ei käytetä todellisen kattavuuden korvikkeena.

Keruu säilyttää sarjatunnisteet, määritelmät, yksiköt, maantieteen, ryhmäavaimet ja nimikkeet, todelliset tallennetut vuodet, rivi- ja ei-NULL-määrät, arvotyypit, validointimerkinnät sekä sarja- ja havaintokohtaiset lähdeviitteet versioineen. Puuttuvia vuosia ei täytetä. Ei-NULL ei osoita numeerisuutta tai lähteen oikeellisuutta. Harvat vuosipisteet eivät muutu jatkuvaksi sarjaksi; ryhmät voivat olla päällekkäisiä. Eri lukuerien keruu ei ole yhtä atomista koko tietokannan otosta.

Julkaistujen historiallisten tapahtumien aiheosumat ja niiden olemassa olevat lähdeviitteet tallennetaan myös ehdokkaiksi. Sanahaku tuottaa vääriä osumia ja voi jättää relevantteja termejä ulkopuolelle: tämä ei ole tietokannan kaiken aineiston kattavuusarvio.

`editorial__article_data_discoveries` sisältää versioidut artikkelikohtaiset raportit, artikkelirevision ja tekstitiivisteen. Lähde- ja artikkelitaulut säilyvät muuttumattomina. Ristiriitainen uusinta samalla versiolla estetään ja tallennus luetaan takaisin uudella yhteydellä. Raportti kulkee avustajalle salattuna ja näkyy editorin analyysikerroksessa. Vain koontimäärät tulostetaan julkiseen ajolokiin.

Kaikki löydökset ovat `candidate_only` / `not_assessed`: ne eivät automaattisesti vähennä puutelistan tehtäviä tai vahvista kausaalisia ketjuja. Seuraava työ on valita täsmälliseen artikkeliväitteeseen sopivat sarjat, tarkistaa alkuperäislähde ja mittarin rajaus, laskea kuvailevat havainnot sekä tallentaa hyväksytty väite–sarja–havaintoyhteys erikseen. Uutta ulkoista aineistoa kerätään vasta tarpeen mukaan.

## Ensimmäiset varmennetut artikkeli–sarja-kytkennät

`article_series_evidence.py` vertaa kahden artikkelin rajattuja kuvailevia laskelmia suoraan alkuperäisiin StatFin 15ai -vastauksiin. Alkuperäiset 75 toimialojen työllisyyssolua (1960–1974, viisi toimialarajausta sisältäen yhteensä-rivin) ja 14 julkisen kulutuksen indeksisolua (1946–1959) sekä tarkat kyselyt ja SHA-256-tiivisteet ovat `scripts/editorial/sources/article15ai-*`-tiedostoissa. `collect_article_series_reference.py` toistaa keruun.

Väiteankkurit pysyvät yksityisissä salatuissa paketeissa. Ennen tuontia tarkistetaan sarjatunniste, yksikkö, alue, ryhmäavain, kaikki havaintovuodet ja jokaisen tallennetun luvun desimaaliarvo. NULL, ylimääräinen tai puuttuva ryhmä/vuosi, poikkeava yksikkö tai muuttunut luku estää tallennuksen. Sarjoja ja artikkelitekstejä ei muuteta. Kytkennät tallentuvat erillisinä täydennyksinä ja luetaan takaisin tuoreella yhteydellä. `data_links` sisältää pysyvät sarja- ja ryhmäavaimet, havaintovuodet, solumäärät ja alkuperäisen vastauksen tiivisteen; `computed` säilyttää laskelman. Havaintovuodet näkyvät myös analyysikerroksessa. Luokitus koskee alkuperäistä väitekatkelmaa ja on toimituksellinen ehdotus.

Toimialaosuuksien nimittäjä on lähteen kotimaan työllisten yhteensä-rivi. Neljän toimialan summan ja kokonaismäärän ero saa olla enintään 2,5 tuhatta henkilöä, mikä vastaa viiden kokonaisiksi tuhansiksi pyöristetyn luvun yhteenlaskettua pyöristysrajaa. Osuudet eivät kuvaa samoja ihmisiä ajassa eivätkä erittele palvelujen yksityistä ja julkista tuotantoa. Julkisen kulutuksen indeksin päätevuosivertailu ei oleta tasaisen kasvun tapahtuneen välivuosina. Se ei ole valtion budjetti, julkinen kokonaismeno tai tulonsiirtojen mittari.

Yksiköitä tai menetelmäjaksoja ei ketjuteta itse. Historialliset rekonstruktiot ja vuosien 1960/1975 menetelmärajat huomioidaan rajauksissa. Kuvaileva tilasto ei tunnista julkisen menon tuotantovaikutusta, työn tehtävärakenteen muutosta tai tehokkuuden yhteiskunnallista nettokustannusta. Suppea havaintojakso ei automaattisesti sulje puutetta, jonka artikkeliväite kattaa laajemman ajan.
