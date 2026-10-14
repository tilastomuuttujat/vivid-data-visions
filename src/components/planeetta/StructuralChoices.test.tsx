import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { StructuralChoices } from './StructuralChoices';
import { structuralEvents, norwayShares, transitionChange } from './structural-choices';
import { TimelineProvider } from './timeline-context';
import { SharedTimeline } from './SharedTimeline';
import { RegionalPath } from './RegionalPath';
afterEach(cleanup);
it('separates a share proposal from a realised sale and preserves the Norwegian reversal',()=>{
 expect(structuralEvents.find(e=>e.id==='leonia-proposal-2000')?.kind).toBe('Hallituksen esitys');
 expect(structuralEvents.find(e=>e.id==='sampo-closing-2007')?.kind).toBe('Toteutunut kauppa');
 expect(norwayShares.find(p=>p.year===2009)!.value).toBeGreaterThan(norwayShares.find(p=>p.year===2007)!.value);
 expect(transitionChange('MK08',2024,'industry')).toBeNull();
 expect(transitionChange('MK08',2000,'industry')?.change).toBe(0);
});
it('links regional controls and keeps two-sector net changes distinct from replacement jobs',()=>{
 render(<TimelineProvider initialYear={2010}><StructuralChoices/><RegionalPath/></TimelineProvider>);
 fireEvent.change(screen.getByRole('combobox',{name:'Siirtymän maakunta'}),{target:{value:'MK01'}});
 expect(screen.getByRole('combobox',{name:'Maakunta'})).toHaveValue('MK01');
 expect(screen.getByText(/Nettomuutos ei kerro, siirtyivätkö samat ihmiset/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/3.3.2000 · HE 9\/2000/}));
 expect(screen.getByText(/43 % on tämän esityksen suunniteltu osuus/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/1.2.2007 · Danske-kauppa/}));
 expect(screen.getByText(/Myyntivoitto ei ole sama kuin kauppahinta/)).toBeInTheDocument();
});
it('opens influence-channel proposals from the shared timeline with their limits',()=>{
 render(<TimelineProvider><SharedTimeline/></TimelineProvider>);
 fireEvent.change(screen.getByRole('combobox',{name:'Tapahtumien päätöspolku'}),{target:{value:'Omistus ja vaikutusvalta'}});
 fireEvent.click(screen.getByRole('button',{name:/13.2.2015: EK ehdottaa säästöjä/}));
 expect(screen.getByText(/ei hallituksen toteutunut päätös/)).toBeInTheDocument();
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2015');
});
