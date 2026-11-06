# Väestöaineiston vertailusynteesi artikkelieditorissa

Editorin **Väitteet ja aikakausimatriisi → Lataa analyysikerros → Väestöaineiston vertailusynteesi** kokoaa kuuden ryhmän ensimmäiset väestökytkennät samaan näkymään. Jokaisessa ryhmässä näkyy mitä lähdeaineisto tukee, mitä siitä ei voi päätellä ja mikä näyttö tarvitaan seuraavaksi. Ryhmän avaamalla saa näkyviin nykyisten artikkeleiden tarkat väitekatkelmat ja niiden lähdehavainnot. **Avaa koko lähdekortti** siirtyy alkuperäiseen korttiin rajoituksineen ja lähdelinkkeineen.

## Vertailun yhteinen tulos

| Ryhmä | Mitä nykyinen näyttö tarkentaa | Mitä se ei ratkaise |
|---|---|---|
| Työ | Väestö, rekisterityöllisyys ja vuotuinen työpanos muuttuvat eri tavoin | Muutosten syyt, työkyky tai yksittäisen politiikan vaikutus |
| Koulutus | Ikäluokkien alueellinen mittakaava ja vuosiluokkien erilainen ajoitus | Osallistumisaste, kapasiteetti, saavutettavuus tai oppimistulos |
| Hoiva | Vanhimpien ikäryhmien kasvu ja toteutunut kotihoito ovat eri tietoja | Hoivan koko tarve, riittävyys ja läheisten työn määrä |
| Sosiaaliturva | Perustoimeentulotuen saajajakauma on etuus- ja elämäntilannekohtainen | Oikeutettujen määrä, alikäyttö tai etuudelta poistumisen syy |
| Alueet | Luonnollinen muutos, eri muuttovirrat ja korjaukset voivat vaikuttaa vastakkaisiin suuntiin | Muuttamisen motiivit, työvaikutukset tai kuulumisen kokemus |
| Julkinen talous | Menojen tehtäväjakauma, nimelliseurot ja BKT-osuudet ovat eri mittareita | Reaalinen palvelumäärä, demografinen kustannusvaikutus tai kestävyysvaje |

Näyttö vahvistaa yhteisen **tutkimusasetelman**: väestön mittakaava ja rakenne on erotettava instituutioiden toiminnasta ja toteutuneista tuloksista. Se ei todista, että oikeudet olisivat kautta historian laajentuneet käyttämisen edellytyksiä nopeammin, eikä aseta väestöä kaikkia muita ensisijaisemmaksi selittäjäksi. Instituutioiden välitysmekanismit jäävät tutkittaviksi, eivät muutu kausaalisiksi tuloksiksi lähdekorttien lukumäärän kasvaessa.

## Seuraavan työn järjestys

1. **Yhteensopivat väestönimittäjät:** etuus- ja osallistumisosuudet vasta kun ikä, alue ja viiteaika täsmäävät. Raakamäärä ei osoita ryhmän riskiä.
2. **Tarve ja saavutettavuus:** toimintakyky, palvelutarpeen arvio, henkilöstö, matkat ja viiveet samoissa ryhmissä, paikoissa ja vuosissa. Käyttö ei yksin osoita riittävyyttä.
3. **Menojen hinnat, määrät ja rahoitus:** tehtäväkohtaiset indeksit, etuustasot, saajat, työllisyys ja tulot ennen kustannusvaikutuksia tai tulevaisuuslaskelmia.

Nämä ovat toimituksellisia työprioriteetteja, eivät automaattinen aineiston totuus- tai tärkeysjärjestys. Muut aikakausi- ja lähdeaukot säilyvät nykyisessä puutelistassa.

## Ajantasaisuus ja puuttuvat tiedot

Vertailu käyttää vain kuutta erikseen tarkistettua lähdeperhettä ja niiden kahtatoista artikkelikytkentää. Jäsenyyttä ei päätellä sanahaulla, eikä toista samannimistä artikkelia korvata alkuperäisellä. Kytkentä hyväksytään vertailuun vain kun artikkelirevisio, täydennyksen odotettu lähdeversio ja luokitus ovat ajantasaiset. Tarkistettu lähdekonteksti ei hyväksy kausaalista vaikutusta.

Puuttuva, muuttunut tai luokittelematon kytkentä saa erillisen tarkistusmerkinnän; sitä ei näytetä nollana ilmiön olemassaololle. **6/6** tarkoittaa vain molempien kytkentöjen ajantasaisuutta kaikissa kuudessa ryhmässä. Se ei ole aineiston valmiusaste eikä riippumattomien tutkimusten määrä.

Näkymä muodostuu kulloinkin avatun yksityisen kirjaston tiedoista. **Lataa vertailusynteesi JSON** tallentaa omalle laitteelle tiiviin katsauksen: väitekatkelmat, revisiot, lähdeversiot, havainnot, rajaukset ja lähdeviitteet. Se ei monista suuria lähdeaineistoja. Julkinen editori-HTML sisältää vain ohjelmakoodia ja yleisiä arviointisääntöjä; artikkelitekstejä tai tunnisteita ei lisätä siihen.

## Varmennus

Mallin testit tarkistavat kaikki kuusi ryhmää, puuttuvat ja vanhentuneet artikkelit, väärät lähdeversiot, puuttuvat ankkurit sekä ristiriitaiset kausaalimerkinnät. DOM-testi tarkistaa renderöinnin, siirtymisen tarkkaan korttiin ja tiiviin JSON-viennin. `check_population_synthesis.mjs` tarkistaa oikean kirjaston kaikki 12 nykyistä kytkentää lukutoimintona. Sivu ei kirjoita tietokantaan eikä hyväksy artikkelien toimituksellista tilaa.

Tarkistukset: `node --test scripts/editorial/analysis-model.test.mjs scripts/editorial/population-synthesis-dom.test.mjs`; HTML rakennetaan komennolla `python scripts/editorial/build_browser.py`.
