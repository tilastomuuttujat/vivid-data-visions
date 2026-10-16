// Metatarinan runko: 5 päävaihetta × 2 jaksoa ja valikoidut käännepisteet (käyttäjän infografiikoista).
// Lait kytketään jaksoihin vuoden perusteella lainsaadanto.json-aineistosta.
import data from '@/data/lainsaadanto.json';

export type Decision = (typeof data.paatokset)[number];
export type Period = { id: string; from: number; to: number; title: string; sub: string };
export type Phase = { n: number; title: string; from: number; to: number; tone: string; periods: [Period, Period] };
export type TurnKind = 'paatos' | 'kriisi' | 'rakenne';
export type Turn = { from: number; to: number; label: string; title: string; sub: string; kind: TurnKind };

export const PHASES: Phase[] = [
  { n: 1, title: 'Toimintamahdollisuuksien perusta', from: 1850, to: 1905, tone: 'var(--m-green)', periods: [
    { id: 'p1a', from: 1850, to: 1862, title: 'Rajoituksista uudistusten alkuun', sub: 'Tieto, tuotanto ja liikkuminen' },
    { id: 'p1b', from: 1863, to: 1905, title: 'Sivistys, markkinat ja paikallishallinto', sub: 'Kieli, koulutus, kunnat ja elinkeinot' }] },
  { n: 2, title: 'Kansalaisuus ja valtion selviytyminen', from: 1906, to: 1944, tone: 'var(--m-red)', periods: [
    { id: 'p2a', from: 1906, to: 1918, title: 'Kansanvalta laajenee, yhteiskunta repeää', sub: 'Oikeudet, itsenäistyminen ja sisällissota' },
    { id: 'p2b', from: 1919, to: 1944, title: 'Tasavallan vakauttaminen ja poikkeusolot', sub: 'Eheyttäminen, oikeusrajoitukset ja sodat' }] },
  { n: 3, title: 'Yhteisen kantokyvyn laajentaminen', from: 1945, to: 1984, tone: 'var(--m-blue)', periods: [
    { id: 'p3a', from: 1945, to: 1965, title: 'Jälleenrakennus ja avautuva Pohjola', sub: 'Koti, toimeentulo ja liikkuvuus' },
    { id: 'p3b', from: 1966, to: 1984, title: 'Koko väestön osaaminen ja toimintakyky', sub: 'Peruskoulu, terveys, päivähoito ja työ' }] },
  { n: 4, title: 'Vapautuminen, kriisi ja uusi menestys', from: 1985, to: 2007, tone: 'var(--m-gold)', periods: [
    { id: 'p4a', from: 1985, to: 1994, title: 'Rahoitusmurros, lama ja riskinjako', sub: 'Pankit, valtio, yritykset ja kotitaloudet' },
    { id: 'p4b', from: 1995, to: 2007, title: 'Integraatio ja teknologiavetoinen nousu', sub: 'EU, euro ja uuden kasvun edellytykset' }] },
  { n: 5, title: 'Uudistumisen vaikeus ja uudet vastuut', from: 2008, to: 2025, tone: 'var(--m-teal)', periods: [
    { id: 'p5a', from: 2008, to: 2019, title: 'Kasvupohjan järkkyminen ja sopeutuminen', sub: 'Rakennemuutos, tuottavuus ja turva' },
    { id: 'p5b', from: 2020, to: 2025, title: 'Kasautuneet paineet ja uudet kriisit', sub: 'Pandemia, hoiva ja turvallisuus' }] },
];

export const TURNS: Turn[] = [
  { from: 1857, to: 1866, label: '1857–1866', title: 'Tuotannon ja sivistyksen avaaminen', sub: 'Höyrysahat, rautatie, kieliasetus, kunnat ja kansakoulu', kind: 'paatos' },
  { from: 1906, to: 1906, label: '1906', title: 'Yleinen ja yhtäläinen äänioikeus', sub: 'Poliittinen osallistuminen laajenee', kind: 'paatos' },
  { from: 1917, to: 1917, label: '1917', title: 'Itsenäistyminen ja 8 tunnin työaikalaki', sub: 'Valtiollinen vastuu kasvaa, työaikaa rajataan', kind: 'paatos' },
  { from: 1918, to: 1918, label: '1918', title: 'Sisällissota ja vankileirikatastrofi', sub: 'Yhteiskunnan jakautuminen muuttuu väkivallaksi', kind: 'kriisi' },
  { from: 1918, to: 1921, label: '1918–1921', title: 'Torpparivapautus, tasavalta ja oppivelvollisuus', sub: 'Omistuksen, oikeuksien ja koulutuksen perustaa laajennetaan', kind: 'paatos' },
  { from: 1939, to: 1945, label: '1939–1945', title: 'Sodat ja jälleenrakennuksen alku', sub: 'Menetykset, asuttaminen ja tuotannon uudistaminen', kind: 'kriisi' },
  { from: 1943, to: 1954, label: '1943–1954', title: 'Arjen turva ja avoimempi Pohjola', sub: 'Kouluruoka, neuvolat, lapsilisät ja yhteiset työmarkkinat', kind: 'paatos' },
  { from: 1961, to: 1973, label: '1961–1973', title: 'Laajan hyvinvointivaltion ratkaisut', sub: 'Työeläke, peruskoulu, kansanterveys ja päivähoito', kind: 'paatos' },
  { from: 1980, to: 1989, label: '1980-luku', title: 'Rahoitusmarkkinat vapautuvat', sub: 'Luoton saatavuus ja velkariskit kasvavat', kind: 'rakenne' },
  { from: 1991, to: 1993, label: '1991–1993', title: 'Lama, pankkikriisi ja markan kellutus', sub: 'Järjestelmän vakauttaminen ja kustannusten jakaminen', kind: 'kriisi' },
  { from: 1995, to: 2002, label: '1995–2002', title: 'EU-jäsenyys ja yhteinen raha', sub: 'Markkinat avautuvat, rahapolitiikan vastuu muuttuu', kind: 'paatos' },
  { from: 2008, to: 2014, label: '2008–2014', title: 'Finanssikriisi ja Nokian matkapuhelinmurros', sub: 'Keskeiset kasvun lähteet järkkyvät', kind: 'kriisi' },
  { from: 2020, to: 2022, label: '2020–2022', title: 'Pandemia ja turvallisuusympäristön murros', sub: 'Julkisen riskinkannon tarve kasvaa', kind: 'kriisi' },
  { from: 2021, to: 2025, label: '2021–2025', title: 'Vastuiden ja tulevaisuuspanostusten uudet valinnat', sub: 'Oppivelvollisuus, sote, T&K-rahoitus ja Nato; myös turvan leikkauksia', kind: 'paatos' },
];

export const KIND_LABEL: Record<TurnKind, string> = { paatos: 'Päätös', kriisi: 'Kriisi', rakenne: 'Rakennemuutos' };

export const DECISIONS = data.paatokset as Decision[];
export const PREP = data.valmistelu;
export const FUNDING = data.rahoitus;
export const GUIDE = data.lukuohje;

export function decisionsIn(from: number, to: number) {
  return DECISIONS.filter((d) => d.vuosi >= from && d.vuosi <= to).sort((a, b) => a.vuosi - b.vuosi);
}

/** Neljä kysymystä johdetaan jakson päätösten arvioista — ei mitattuja vaikutuksia. */
export function fourQuestions(list: Decision[]) {
  return {
    vahvistui: list.filter((d) => d.arvioLuokka === 'vahvistava'),
    heikkeni: list.filter((d) => d.arvioLuokka === 'heikentava' || d.arvioLuokka === 'ristiriitainen'),
    riski: list.filter((d) => d.riskinjako),
    viive: list.filter((d) => d.toimeenpano && d.toimeenpano !== d.aika),
  };
}
