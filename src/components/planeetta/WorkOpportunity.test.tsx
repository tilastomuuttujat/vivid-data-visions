import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { WorkOpportunity } from './WorkOpportunity';
import { employmentShare, jobChanges, longTermShare, ratio, workIndex, workPoint, workRegions } from './work-opportunity';
import { TimelineProvider } from './timeline-context';
import { SharedTimeline } from './SharedTimeline';
import { exactValue, timelineLanes } from './timeline-model';
afterEach(cleanup);
it('keeps residents, jobs and monthly stock averages distinct',()=>{
 const point=workPoint('MK08',2024)!;
 expect(point.employed).toBe(58931);
 expect(point.jobs['SSS']).toBe(58589);
 expect(point.jobseekers).toBeCloseTo(8819.333333333334);
 expect(point.longTerm).toBeCloseTo(2740.4166666666665);
 expect(longTermShare('MK08',2024)).toBeCloseTo(point.longTerm!/point.jobseekers!*100);
 expect(employmentShare('MK08',2024)).toBeCloseTo(58931/85610*100);
 expect(workIndex('MK08',1987,'workingAge',1987)).toBe(100);
 for(const r of workRegions)for(const p of r.points)expect(p.employed!+p.unemployed!+p.outside!).toBe(p.workingAge);
});
it('balances mutually exclusive industry contributions without inventing individual transitions',()=>{
 const change=jobChanges('MK08',2007,2024)!;
 expect(change.total).toBe(-13214);
 expect(change.groups.find(g=>g.id==='C')?.value).toBe(-5897);
 expect(change.groups.find(g=>g.id==='Q')?.value).toBe(2270);
 expect(change.groups.reduce((n,g)=>n+g.value,0)).toBe(change.total);
 expect(jobChanges('MK08',1987,2024)).toBeNull();
 expect(ratio(0,0)).toBeNull();
 expect(workPoint('MK08',2025)).toBeNull();
 expect(workPoint('MK08',2008)?.jobseekers).toBeNull();
});
it('synchronizes both year and region and leaves early observations unavailable',()=>{
 render(<TimelineProvider initialYear={2024}><SharedTimeline/><WorkOpportunity/></TimelineProvider>);
 fireEvent.change(screen.getByRole('combobox',{name:'Työnäkymän maakunta'}),{target:{value:'MK01'}});
 expect(screen.getByRole('combobox',{name:'Maakunta'})).toHaveValue('MK01');
 fireEvent.change(screen.getByRole('slider',{name:/Työnäkymän vuosi/}),{target:{value:'1990'}});
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','1990');
 expect(screen.getByText(/Valitulta vuodelta ei muodosteta työpaikkavertailua/)).toBeInTheDocument();
 expect(screen.getByRole('combobox',{name:'Työpaikkavertailun lähtövuosi'})).toBeDisabled();
 const table=screen.getByRole('table',{name:'Uusimaa · vuosihavainnot'});
 expect(within(table).getByRole('row',{name:/^1987 /})).toHaveTextContent('Ei havaintoa');
});
it('marks year coverage and explains population, pay and migration limits',()=>{
 render(<TimelineProvider initialYear={2025}><WorkOpportunity/></TimelineProvider>);
 expect(screen.getByText(/Näytetään havaintovuosi 2024/)).toBeInTheDocument();
 expect(screen.getByText(/Muuttoliikkeestä ei tiedetä muuttajien työmarkkina-asemaa/)).toBeInTheDocument();
 expect(screen.getByText(/Koko maan reaaliansiot eivät kerro korvaavan työpaikan palkasta/)).toBeInTheDocument();
});
it('makes region-specific historical observations available without future extrapolation',()=>{
 const lane=timelineLanes('MK08').find(l=>l.id==='opportunity')!;
 expect(exactValue(lane.series[0]!,2024)).toBeCloseTo(58931/85610*100);
 expect(exactValue(lane.series[1]!,2008)).toBeNull();
 for(const series of lane.series)expect(exactValue(series,2025)).toBeNull();
 expect(lane.series[0]?.breaks).toContain(2019);
});
