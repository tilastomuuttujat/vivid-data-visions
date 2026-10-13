import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { TimelineProvider } from './timeline-context';
import { SharedTimeline } from './SharedTimeline';
import { policyRecords } from './policy-history';
afterEach(cleanup);
it('distinguishes policy aims, proposal, enacted law and commencement',()=>{
 expect(new Set(policyRecords.map(r=>r.id)).size).toBe(policyRecords.length);
 expect(policyRecords.find(r=>r.id==='dual-tax-proposal')?.phase).toBe('Hallituksen esitys');
 expect(policyRecords.find(r=>r.id==='dual-tax-law')?.year).toBe(1992);
 expect(policyRecords.find(r=>r.id==='dual-tax-entry')?.year).toBe(1993);
 expect(policyRecords.find(r=>r.id==='dual-tax-law')?.sources[0]?.url).toContain('/saadoskokoelma/1992/1535');
});
it('opens the tax proposal with short- and long-term forecasts and filters other events',()=>{
 render(<TimelineProvider><SharedTimeline/></TimelineProvider>);
 fireEvent.change(screen.getByRole('combobox',{name:'Tapahtumien päätöspolku'}),{target:{value:'Verotus'}});
 expect(screen.queryByRole('button',{name:/29.7.2014: Osakevaihto/})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/25.9.1992: Eriytetyn tuloverotuksen esitys/}));
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','1992');
 expect(screen.getByText(/1,1 miljardia markkaa/)).toBeInTheDocument();
 expect(screen.getByText(/1–2 miljardin markan kasvu/)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:/alkuperäinen HE 200\/1992/})).toHaveAttribute('href',expect.stringContaining('910657/mainPdf'));
 fireEvent.click(screen.getByRole('button',{name:/1.1.1993: Ansio- ja pääomatulojen eriytetty verotus alkaa/}));
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','1993');
});
