import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { LocalAdaptation } from './LocalAdaptation';
import { adaptationCases, adaptationEvidence, firstReturn, localChange, localEducationShare, localEmploymentShare, localIndex, localJobChanges, localPlaces, localPoint } from './local-adaptation';
import { TimelineProvider } from './timeline-context';
import { SharedTimeline } from './SharedTimeline';
afterEach(cleanup);
it('keeps municipal residents, jobs and education age groups distinct',()=>{
 const p=localPoint('KU075',2024)!;
 expect(p.employed).toBe(7184);
 expect(p.jobs['SSS']).toBe(6057);
 expect(p.workingAge).toBe(10263);
 expect(localEmploymentShare('KU075',2024)).toBeCloseTo(7184/10263*100);
 expect(localEducationShare('KU075',2024)).toBeCloseTo(2961/9905*100);
 for(const place of localPlaces)for(const p of place.points){expect(p.employed!+p.unemployed!+p.outside!).toBe(p.workingAge);if(p.higherEducation!==null)expect(p.higherEducation).toBeLessThanOrEqual(p.educationPopulation!);}
});
it('balances sector changes and does not invent missing years or a pre-event comparison',()=>{
 const changes=localJobChanges('KU075',2007,2024)!;
 expect(changes.total).toBe(-2258);
 expect(changes.groups.reduce((s,g)=>s+g.value,0)).toBe(changes.total);
 expect(localIndex('KU075',2007,'jobs',2007)).toBe(100);
 expect(localJobChanges('KU075',2007,2005)).toBeNull();
 expect(localChange('KU075',2000,'jobs',2007)).toBeNull();
 expect(localPoint('KU075',2025)).toBeNull();
 expect(localPoint('KU075',2006)?.jobs['SSS']).toBeUndefined();
 expect(firstReturn('hamina','jobs',2024)).toBeNull();
 expect(firstReturn('kajaani','jobs',2010)).toBeNull();
 expect(firstReturn('kajaani','jobs',2011)).toBe(2011);
 expect(localChange('KU205',2024,'jobs',2007)).toBeLessThan(0);
 expect(firstReturn('hamina','jobs',2007)).toBeNull();
 expect(firstReturn('salo','jobs',2025)).toBeNull();
});
it('does not manufacture a population jump at the Salo municipal merger',()=>{
 const a=localPoint('KU734',2008)!.population!,b=localPoint('KU734',2009)!.population!;
 expect(a).toBeGreaterThan(50000);expect(b).toBeGreaterThan(50000);
 expect(Math.abs(b/a-1)).toBeLessThan(.05);
 expect(adaptationCases.find(c=>c.id==='salo')?.eventYear).toBe(2012);
 expect(adaptationEvidence.find(e=>e.id==='salo-production')?.kind).toBe('Yhtiön ilmoitus');
 expect(adaptationEvidence.find(e=>e.id==='kajaani-retraining')?.limit).toMatch(/ei ole uusien työpaikkojen/);
});
it('uses matching axes and offers both calendar and event-aligned comparisons',()=>{
 render(<LocalAdaptation/>);
 const charts=screen.getAllByRole('img',{name:/Vertailu koko maahan/});
 expect(within(charts[0]!).getByText('100').getAttribute('y')).toBe(within(charts[1]!).getByText('100').getAttribute('y'));
 fireEvent.click(screen.getByRole('checkbox',{name:'Kohdista tapahtumavuoteen'}));
 expect(screen.getAllByText(/vaaka-akseli: vuotta tapahtumasta/)).toHaveLength(2);
 expect(screen.getByText(/pystyasteikko on sama/)).toBeInTheDocument();
});
it('links the year and selected municipality to its maakunta while keeping the comparison independent',()=>{
 render(<TimelineProvider initialYear={2024}><SharedTimeline/><LocalAdaptation/></TimelineProvider>);
 fireEvent.change(screen.getByRole('combobox',{name:'Tarkasteltava paikkakunta'}),{target:{value:'salo'}});
 expect(screen.getByRole('combobox',{name:'Maakunta'})).toHaveValue('MK02');
 fireEvent.change(screen.getByRole('combobox',{name:'Vertailupaikkakunta'}),{target:{value:'kajaani'}});
 expect(screen.getByRole('combobox',{name:'Maakunta'})).toHaveValue('MK02');
 fireEvent.change(screen.getByRole('slider',{name:/Sopeutumisen havaintovuosi/}),{target:{value:'2015'}});
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2015');
 expect(screen.getByRole('combobox',{name:'Tapahtumien päätöspolku'})).toContainHTML('Kuntien sopeutuminen');
});
it('marks latest-year coverage and explains why aggregate recovery is not displaced workers returning to work',()=>{
 render(<TimelineProvider initialYear={2025}><LocalAdaptation/></TimelineProvider>);
 expect(screen.getByText(/Näytetään havaintovuosi 2024/)).toBeInTheDocument();
 expect(screen.getByText(/samojen ihmisten työllistymistä/)).toBeInTheDocument();
 expect(screen.getByText(/suoraa palveluverkon, matka-aikojen tai asumisen/)).toBeInTheDocument();
 expect(screen.getByText(/Muuttoliike muuttaa myös tätä osuutta/)).toBeInTheDocument();
});
