import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { FamilyPolicy } from './FamilyPolicy';
import { SharedTimeline } from './SharedTimeline';
import { TimelineProvider } from './timeline-context';
import { cabinetsInYear, familyPolicyEvents, fertility } from './family-policy-data';
import { exactValue, timelineLanes } from './timeline-model';
afterEach(cleanup);
it('retains every annual observation and all cabinets in transition years',()=>{
 expect(fertility.points.map(p=>p.year)).toEqual(Array.from({length:16},(_,i)=>2010+i));
 expect(cabinetsInYear(2019).map(c=>c.id)).toEqual(['sipila','rinne','marin']);
 expect(cabinetsInYear(2023).map(c=>c.id)).toEqual(['marin','orpo']);
 expect(cabinetsInYear(2022).every(c=>c.kok==='Oppositiossa')).toBe(true);
 expect(familyPolicyEvents.find(e=>e.id==='child-benefit-2015')?.government).toContain('Stubbin');
 const lane=timelineLanes('MK08').find(l=>l.id==='fertility')!;
 expect(exactValue(lane.series[0]!,2025)).toBe(1.3);
});
it('distinguishes opposing benefit changes, a speech and the research limitations',()=>{
 render(<FamilyPolicy/>);
 fireEvent.click(screen.getByRole('button',{name:/lapsilisään korotus/}));
 expect(screen.getByText(/26 euron kuukausikorotus/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/Työttömyysturvan lapsikorotukset poistuvat/}));
 expect(screen.getByText(/liikkuvuusavustuksen lapsikorotukset poistettiin/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/Orpon budjettiviesti/}));
 expect(screen.getByText(/yksittäinen puhetilanne, ei laki/)).toBeInTheDocument();
 expect(screen.getByText(/ei ole yksittäisten hallitusten tai leikkausten kausaalinen arvio/)).toBeInTheDocument();
});
it('links years and policy events with the shared timeline without attributing the reform to Kokoomus',()=>{
 render(<TimelineProvider initialYear={2022}><SharedTimeline/><FamilyPolicy/></TimelineProvider>);
 fireEvent.change(screen.getByRole('combobox',{name:'Tapahtumien päätöspolku'}),{target:{value:'Perheet ja työvoima'}});
 fireEvent.click(screen.getByRole('button',{name:/1.8.2020: Kokoaikainen varhaiskasvatusoikeus/}));
 expect(screen.getByRole('combobox',{name:'Perhepolitiikan tarkasteluvuosi'})).toHaveValue('2020');
 expect(screen.getAllByText(/Valmistelu Rinteen kaudella/).length).toBeGreaterThan(0);
 fireEvent.change(screen.getByRole('combobox',{name:'Perhepolitiikan tarkasteluvuosi'}),{target:{value:'2025'}});
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2025');
});
