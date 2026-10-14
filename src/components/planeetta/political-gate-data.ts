import type { PolicyRecord } from './policy-history';
import { electionYears, partySeries } from './historical-election-data';
export const gateSources={
 crisis:'https://areena.yle.fi/1-50237847',
 coalition:'https://yle.fi/a/20-86378',
 koivisto:'https://www.presidentti.fi/presidentin-toimi/edelliset-presidentit/presidentti-mauno-koivisto/',
 government:'https://valtioneuvosto.fi/hallitukset-ja-ministerit/hallitukset/-/gov/holkeri',
 start:'https://valtioneuvosto.fi/hallitukset-ja-ministerit/hallitukset/-/gov/koivisto-ii',
 finance:'https://publications.bof.fi/handle/10024/43612',
};
export const gateElectionResults=[1979,1983,1987].map(year=>{
 const i=electionYears.indexOf(year);
 return {year,kok:partySeries.find(p=>p.id==='kok')!.values[i]!,sdp:partySeries.find(p=>p.id==='sdp')!.values[i]!,kesk:partySeries.find(p=>p.id==='kesk')!.values[i]!};
});
export const politicalGateRecords:PolicyRecord[]=[
 {id:'koivisto-confidence-1981',year:1981,date:'Huhtikuu 1981',title:'Koivisto kieltäytyy eroamasta',theme:'Valta',phase:'Poliittinen valtakiista',actors:'Presidentti Urho Kekkonen ja pääministeri Mauno Koivisto; eduskunnan luottamus hallituksen toimintaperustana.',change:'Koivisto torjui Kekkosen erovaatimuksen ja vetosi hallituksen eduskunnalta saamaan luottamukseen.',goal:'Koiviston ilmoittama peruste oli parlamentaarinen luottamus.',assessment:'Kiista teki näkyväksi presidentin henkilökohtaisen ohjauksen ja parlamentaarisen toimintaperustan jännitteen.',limit:'Tämä ei ollut samana päivänä tehty perustuslain muutos tai presidentin kaiken vallan päättyminen. Kiista ei itsessään selitä myöhempiä yhtiömyyntejä.',sources:[{title:'Yle: Koivisto kieltäytyi eroamasta pääministerin tehtävistä 1981',url:gateSources.crisis,location:'Arkistokatkelma 1.2.1986 käsittelee huhtikuun 1981 tapahtumaa'}]},
 {id:'koivisto-president-1982',year:1982,date:'1982',title:'Koiviston presidenttikausi alkaa',theme:'Valta',phase:'Henkilö- ja valtakauden vaihdos',actors:'Mauno Koivisto; presidentin valinta.',change:'Koivistosta tuli tasavallan presidentti; hänen kautensa olivat 1982–1994.',goal:'Merkintä ajoittaa presidentin vaihtumisen; se ei ole talouspoliittinen ohjelma.',assessment:'Valtakäytäntöjen muutosta tarkastellaan vuoden 1981 kiistan ja vuoden 1987 hallitusratkaisun rinnalla.',limit:'Presidentin vaihtuminen ei yksin osoita parlamentarismin täydellistä toteutumista eikä määrää talouspolitiikan suuntaa.',sources:[{title:'Tasavallan presidentin kanslia: Mauno Koivisto',url:gateSources.koivisto,location:'Presidenttikaudet ja pääministerikaudet'}]},
 {id:'holkeri-coalition-1987',year:1987,date:'30.4.1987',title:'Kokoomus ja SDP hallitukseen yhdessä',theme:'Valta',phase:'Hallituksen muodostaminen',actors:'Presidentti Mauno Koivisto; pääministeri Harri Holkeri; Kokoomus, SDP, RKP ja SMP.',change:'Holkerin hallitus aloitti. Kokoomuksen pitkä oppositiokausi päättyi ja keskusta jäi hallituksen ulkopuolelle.',goal:'Uuden hallitusyhteistyön muodostaminen. Talouspoliittiset tavoitteet tarkistetaan erikseen hallitusohjelmasta.',assessment:'Ennen vaaleja valmisteltu keskustan, Kokoomuksen ja RKP:n kassakaappisopimus ei toteutunut. Koivisto vaikutti hallitusratkaisuun valitsemalla Holkerin tunnustelijaksi.',limit:'Kannatus, hallitusasema ja presidentin vaikutusvalta ovat eri asioita. Hallitusratkaisu avasi päätöksentekokanavan, mutta ei yksin osoita myöhempien omistusratkaisujen syytä.',sources:[{title:'Valtioneuvosto: Holkerin hallitus',url:gateSources.government,location:'Toimikausi ja ministerien puolueet'},{title:'Yle: vuoden 1987 hallitusratkaisu',url:gateSources.coalition,location:'Kassakaappisopimus ja Koiviston rooli'}]},
];
