import {cleanup,render,screen,fireEvent} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {GroupOpportunity} from './GroupOpportunity';
import {groupCounts,groupRate,groupIncome,groupRegions,educationGroups,ageGroups} from './group-opportunity';
import {TimelineProvider} from './timeline-context';
afterEach(cleanup);
it('balances mutually exclusive activity counts for every group and region',()=>{
 for(const r of groupRegions)for(const year of [1987,1990,2010,2024])for(const kind of ['education','age'] as const)for(const [id] of kind==='education'?educationGroups:ageGroups){const p=groupCounts(r.id,year,kind,id)!;expect(p[0]).toBe(p[1]+p[2]+p[3]);expect(groupRate(r.id,year,kind,id,'employment')).toBeCloseTo(100*p[1]/p[0]);expect(groupRate(r.id,year,kind,id,'unemployment')).toBeCloseTo(100*p[2]/(p[1]+p[2]));}
});
it('sums age counts before deriving rates and keeps missing years missing',()=>{
 const total=ageGroups.reduce((n,[id])=>n+groupCounts('SSS',2024,'age',id)![0],0);
 expect(total).toBe(groupCounts('SSS',2024,'education','SSS')![0]);
 expect(groupCounts('MK08',2025,'age','18-24')).toBeNull();expect(groupIncome(2009,'9','poverty')).toBeNull();expect(groupRate('invalid',2024,'education','9_X','employment')).toBeNull();
});
it('links year and region without substituting national incomes for regional observations',()=>{
 render(<TimelineProvider initialYear={1987}><GroupOpportunity/></TimelineProvider>);
 expect(screen.getByRole('status')).toHaveTextContent('Aineisto alkaa 2010');
 expect(screen.queryByRole('table',{name:/Koko maan toimeentulo/})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Näytä 2024'}));
 expect(screen.getByRole('table',{name:'Koko maan toimeentulo 2024'})).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Ryhmien maakunta'}),{target:{value:'MK01'}});
 expect(screen.getByRole('img',{name:/Uusimaa:/})).toBeInTheDocument();
 expect(screen.getByText(/Tämä osa ei seuraa valittua maakuntaa/)).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Ryhmien tarkastelutapa'}),{target:{value:'age'}});
 expect(screen.getByRole('table',{name:'Ryhmien havainnot 2024'})).toHaveTextContent('55–64-vuotiaat');
 fireEvent.change(screen.getByRole('combobox',{name:'Ryhmien toimeentulomittari'}),{target:{value:'median'}});
 expect(screen.getByRole('table',{name:'Koko maan toimeentulo 2024'})).toHaveTextContent('vuoden 2024 rahassa');
});
it('marks coverage and interpretation limits',()=>{
 render(<TimelineProvider initialYear={2025}><GroupOpportunity/></TimelineProvider>);
 expect(screen.getByText(/Näytetään havaintovuosi 2024/)).toBeInTheDocument();
 expect(screen.getByText(/eivät samojen ihmisten siirtymiä/)).toBeInTheDocument();
 expect(screen.getByText(/ei mittaa työttömyysturvan korvausastetta/)).toBeInTheDocument();
});
