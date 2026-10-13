import { policyRecords } from './policy-history';
export function PolicyHistoryDetails({id}:{id:string}){
 const record=policyRecords.find(r=>r.id===id);
 if(!record)return null;
 return <div className="tl-policy"><p><b>{record.phase} · {record.date} · {record.theme}</b></p><dl>
  <dt>Tekijät ja vastuut</dt><dd>{record.actors}</dd><dt>Mitä muuttui tai ehdotettiin?</dt><dd>{record.change}</dd><dt>Julkilausuttu tavoite</dt><dd>{record.goal}</dd><dt>Vaikutusarvion tila</dt><dd>{record.assessment}</dd><dt>Tulkinnan raja</dt><dd>{record.limit}</dd>
 </dl><ul>{record.sources.map(s=><li key={s.url}><a href={s.url}>{s.title}</a> · {s.location}</li>)}</ul></div>;
}
