import {cleanup,render,screen,fireEvent,within} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {aftermathValue,aftermathYear,aftermathOffsets,aftermathBreak,aftermathDecisions,aftermathEvents} from './crisis-aftermath';
import {crisisValue} from './crisis-management';
import {CrisisAftermath} from './CrisisAftermath';
import {CrisisManagement} from './CrisisManagement';
import {TimelineProvider} from './timeline-context';
import {timelineEvents} from './timeline-model';
afterEach(cleanup);
it('aligns calendar years, uses actual pre-crisis baselines and never fills future observations',()=>{
 expect(aftermathOffsets).toEqual([-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10]);
 expect(aftermathYear('bank',10)).toBe(2001);expect(aftermathYear('finance',10)).toBe(2018);expect(aftermathYear('pandemic',10)).toBe(2030);
 expect(aftermathValue('finance',-1,'employment','change')).toBe(0);expect(aftermathValue('bank',-1,'bankruptcies','index')).toBe(100);
 expect(aftermathValue('pandemic',4,'debt','change')).toBeCloseTo(crisisValue(2024,'debt')!-crisisValue(2019,'debt')!);
 expect(aftermathValue('pandemic',5,'debt','level')).toBeNull();expect(aftermathValue('pandemic',10,'bankruptcies','index')).toBeNull();expect(aftermathValue('bank',11,'employment','level')).toBeNull();
});
it('does not substitute a later income baseline, and flags statistical breaks',()=>{
 for(const t of aftermathOffsets)expect(aftermathValue('bank',t,'poverty','level')).toBeNull();
 expect(aftermathValue('finance',2,'income','change')).toBeNull();expect(aftermathValue('finance',2,'income','level')).not.toBeNull();
 expect(aftermathBreak('finance',9,'employment')).toBe(true);expect(aftermathBreak('pandemic',0,'bankruptcies')).toBe(true);expect(aftermathBreak('pandemic',0,'debt')).toBe(false);
});
it('distinguishes prior preparation from temporary protections and later policy, and integrates all events',()=>{
 expect(aftermathDecisions.filter(d=>d.relation==='Ennen kriisiä suunniteltu').some(d=>d.year<2020&&d.crisis==='pandemic')).toBe(true);
 expect(aftermathDecisions.find(d=>d.id==='after-pandemic-end')!.year).toBe(2022);
 expect(aftermathDecisions.find(d=>d.id==='after-pandemic-policy')!.relation).toBe('Myöhempi poliittinen valinta');
 expect(new Set(aftermathEvents.map(d=>d.id)).size).toBe(aftermathEvents.length);
 for(const d of aftermathEvents)expect(timelineEvents.find(e=>e.id===d.id)).toBeDefined();
});
it('selects a decision from the graph with keyboard and changes the shared year',()=>{
 render(<TimelineProvider initialYear={2020}><CrisisManagement/></TimelineProvider>);
 const plot=screen.getByRole('img',{name:'Julkisen vastuun jälki: kolme kriisiä samalla suhteellisella aikajanalla'});
 fireEvent.keyDown(within(plot).getByRole('button',{name:/Yrittäjien väliaikainen työmarkkinatuki päättyi/}),{key:'Enter'});
 expect(screen.getByRole('slider',{name:'Kriisinhallinnan vuosi'})).toHaveValue('2022');
 expect(screen.getAllByText(/Tukioikeuden päättymispäivä ei ole viimeinen maksupäivä/)).toHaveLength(2);
 expect(screen.getByRole('table',{name:'Koronapandemia: lähtövuosi ja viimeinen jälkihavainto'})).toHaveTextContent('2024 (+4)');
});
it('retains the actual selected year outside the comparison and keeps historical poverty missing',()=>{
 const setYear=vi.fn();render(<CrisisAftermath active="bank" year={2024} onYear={setYear}/>);
 expect(screen.getByRole('status')).toHaveTextContent('vertailuvälin ulkopuolella');
 expect(screen.getByRole('table',{name:'Pankkikriisi ja lama: lähtövuosi ja viimeinen jälkihavainto'})).toHaveTextContent('Ei havaintoa');
 fireEvent.change(screen.getByRole('combobox',{name:'Jälkivaiheen toimeentulomittari'}),{target:{value:'income'}});
 expect(screen.getByRole('table',{name:'Pankkikriisi ja lama: lähtövuosi ja viimeinen jälkihavainto'})).toHaveTextContent('2024 €/kulutusyksikkö');
 expect(setYear).not.toHaveBeenCalled();
});
