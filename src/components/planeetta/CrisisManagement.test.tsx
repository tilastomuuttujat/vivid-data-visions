import {cleanup,render,screen,fireEvent,within} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {CrisisManagement} from './CrisisManagement';
import {crisisFunding,crisisValue,crisisEvents} from './crisis-management';
import {TimelineProvider} from './timeline-context';
import {SharedTimeline} from './SharedTimeline';
import {timelineEvents} from './timeline-model';
afterEach(cleanup);
it('keeps authorisations, payments, currencies and missing net costs distinct',()=>{
 const g=crisisFunding.find(f=>f.id==='finance-guarantee')!;expect(g.stage).toBe('valtuus');expect(g.amount).toBe(50000);expect(g.net).toBeNull();
 expect(crisisFunding.find(f=>f.id==='bank-capital')!.currency).toBe('FIM');
 expect(crisisFunding.find(f=>f.id==='pandemic-cost')!.stage).toBe('maksettu');
 expect(crisisFunding.find(f=>f.id==='finnair-loan')!.amount).toBe(600);expect(crisisFunding.find(f=>f.id==='finnair-guarantee')!.amount).toBe(540);
 for(const f of crisisFunding){expect(f.source).toMatch(/^https:/);expect(f.returns).toBeNull();}
});
it('uses observed outcome series with real gaps and no current-value substitution',()=>{
 expect(crisisValue(2024,'bankruptcies')).toBe(3488);expect(crisisValue(2024,'debt')).toBe(61.4);
 expect(crisisValue(1992,'poverty')).toBeNull();expect(crisisValue(2025,'bankruptcies')).toBeNull();expect(crisisValue(2025,'employment')).toBeNull();
});
it('switches crises with the shared year and exposes correct financial stages',()=>{
 render(<TimelineProvider initialYear={2020}><CrisisManagement/></TimelineProvider>);
 expect(screen.getAllByRole('img')).toHaveLength(5);
 const pandemic=screen.getByRole('table',{name:'Koronapandemia: rahoituksen vaiheet'});
 expect(within(pandemic).getByRole('row',{name:/Valtiokonttorin kustannustuet/})).toHaveTextContent('780');
 fireEvent.click(screen.getByRole('button',{name:'Pankkikriisi ja lama 1991–1994'}));
 expect(screen.getByRole('slider',{name:'Kriisinhallinnan vuosi'})).toHaveValue('1992');
 expect(screen.getByRole('table',{name:'Pankkikriisi ja lama: rahoituksen vaiheet'})).toHaveTextContent('markkaa');
 fireEvent.click(screen.getByRole('checkbox',{name:'Rajaa valitun kriisin ympärille'}));
 expect(screen.getByText(/Toimeentuloaineisto alkaa 2010/)).toBeInTheDocument();
 fireEvent.change(screen.getByRole('slider',{name:'Kriisinhallinnan vuosi'}),{target:{value:'2024'}});
 expect(screen.getByRole('status')).toHaveTextContent('rajauksen ulkopuolella');
});
it('includes crisis decisions on the common timeline and marks latest coverage',()=>{
 for(const e of crisisEvents)expect(timelineEvents.some(t=>t.id===e.id)).toBe(true);
 render(<TimelineProvider initialYear={2025}><SharedTimeline/><CrisisManagement/></TimelineProvider>);
 expect(screen.getByText(/Näytetään havaintovuosi 2024/)).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Tapahtumien päätöspolku'}),{target:{value:'Kriisien hallinta'}});
 expect(screen.getAllByRole('button',{name:/Pankkien takausvaltuus/})).toHaveLength(1);
 expect(screen.getByText(/Puuttuva palautus tai nettokustannus ei tarkoita nollaa/)).toBeInTheDocument();
});
