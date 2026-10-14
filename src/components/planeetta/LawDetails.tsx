import { laws } from './law-history';
export function LawDetails({id}:{id:string}){
 const l=laws.find(r=>r.id===id);if(!l)return null;
 return <article className="law-detail"><h3>{l.title} · {l.number}</h3><dl>
 <dt>Säädös annettu</dt><dd>{l.enactedDate} · ei sama kuin eduskunnan hyväksymispäivä</dd><dt>Voimaantulo ja toimeenpano</dt><dd>{l.entryDate}</dd>
 <dt>Tarkistettu sisältö</dt><dd>{l.content}</dd><dt>Yhteiskunnan suunta: mekanismin tulkinta</dt><dd>{l.mechanism}</dd><dt>Suoja, kustannukset ja rajat</dt><dd>{l.distribution}</dd>
 <dt>Valmistelu ja poliittinen vastuu</dt><dd>{l.actors}</dd><dt>Vaikutusnäytön ja tarkistuksen tila</dt><dd>{l.evidence}</dd><dt>Mitä ei päätellä?</dt><dd>{l.limit}</dd>
 </dl><ul>{l.sources.map(s=><li key={s.url}><a href={s.url}>{s.title}</a> · {s.kind} · {s.location}</li>)}</ul></article>;
}
