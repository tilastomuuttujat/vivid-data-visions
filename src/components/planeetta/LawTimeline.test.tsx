import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { LawTimeline } from './LawTimeline';
import { SharedTimeline } from './SharedTimeline';
import { TimelineProvider } from './timeline-context';
import { lawEvents, laws } from './law-history';
import { exactValue, timelineLanes } from './timeline-model';
afterEach(cleanup);
it('keeps enactment, commencement and unverified dates distinct',()=>{
 expect(new Set(laws.map(l=>l.id)).size).toBe(laws.length);
 expect(lawEvents.find(e=>e.id==='law-work-health-1978-enacted')?.year).toBe(1978);
 expect(lawEvents.find(e=>e.id==='law-work-health-1978-entry')?.year).toBe(1979);
 expect(lawEvents.find(e=>e.id==='law-education-2020-entry')?.year).toBe(2021);
 expect(lawEvents.some(e=>e.id==='law-tenants-1918-entry')).toBe(false);
 for(const l of laws){expect(l.evidence.length).toBeGreaterThan(0);expect(l.sources.every(s=>s.url.startsWith('https://'))).toBe(true);}
});
it('opens the actual-law limits, filters paths and keeps unsupported minister shares absent',()=>{
 render(<LawTimeline/>);
 fireEvent.change(screen.getByRole('combobox',{name:'Lakipolku'}),{target:{value:'Koulutus'}});
 expect(screen.queryByRole('button',{name:/1992.*Tuloverolaki/})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/1968.*Laki koulujärjestelmän/}));
 expect(screen.getByText(/osoita uudistuksen aiheuttaneen Kokoomuksen/)).toBeInTheDocument();
 expect(screen.getByText(/pienen positiivisen vaikutuksen verbaaliseen/)).toBeInTheDocument();
 expect(screen.getByText(/ei ole vielä tuotu tarkistettua ministeripäiväaineistoa/)).toBeInTheDocument();
});
it('extends the shared historical frame when an early law is selected and leaves 2025 observations missing',()=>{
 render(<TimelineProvider><SharedTimeline/><LawTimeline/></TimelineProvider>);
 fireEvent.click(screen.getByRole('button',{name:/1866 · Kansakouluasetus/}));
 expect(screen.getByRole('combobox',{name:'Ajallinen kehys'})).toHaveValue('1850');
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','1866');
 fireEvent.change(screen.getByRole('combobox',{name:'Tapahtumien päätöspolku'}),{target:{value:'Lainsäädäntö'}});
 fireEvent.click(screen.getByRole('button',{name:/Pääosin 1.8.2021.*Oppivelvollisuuden laajentaminen.*voimaantulo/}));
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2021');
 expect(screen.getAllByText(/Pääosin 1.8.2021/).length).toBeGreaterThan(0);
 const lanes=timelineLanes('MK08');for(const lane of lanes.filter(l=>l.id!=='fertility'))for(const series of lane.series)expect(exactValue(series,2025)).toBeNull();
});
