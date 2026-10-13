import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { StoraOwnership } from './StoraOwnership';
import { ownershipSnapshots } from './stora-ownership-data';
import { TimelineProvider } from './timeline-context';
import { policyRecords } from './policy-history';
afterEach(cleanup);
it('preserves distinct shares and votes and the earlier majority loss',()=>{
 const before=ownershipSnapshots.find(s=>s.year===1997)!;
 const merger=ownershipSnapshots.find(s=>s.year===1998)!;
 const later=ownershipSnapshots.find(s=>s.year===2018)!;
 expect(before.shares).toBe(44.1);expect(before.votes).toBe(46.8);
 expect(later.shares).toBeLessThan(merger.shares);
 expect(later.votes).toBeGreaterThan(merger.votes);
 expect(policyRecords.find(r=>r.id==='enso-votes-1997')?.date).toBe('1.12.1997');
});
it('labels sparse ownership years and retains personnel and investment limits',()=>{
 render(<TimelineProvider initialYear={2000}><StoraOwnership/></TimelineProvider>);
 expect(screen.getByText(/Näytetään havaintovuosi 1998/)).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Omistushavainto'}),{target:{value:'2018'}});
 expect(screen.getByText(/Solidium, kokonaan valtion omistama yhtiö/)).toBeInTheDocument();
 expect(screen.getByText(/vuoden 2018 maakohtaista lukua ei ole/)).toBeInTheDocument();
 expect(screen.getByText(/mittaustavat eroavat/)).toBeInTheDocument();
});
