import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { StoraComparison } from './StoraComparison';
import { snapshotShare, storaSnapshots } from './stora-comparison-data';
afterEach(cleanup);
it('uses internally matching totals and distinguishes average from year end',()=>{
 expect(storaSnapshots[0]!.total-storaSnapshots[0]!.finland).toBe(25078);
 expect(storaSnapshots[1]!.finland).toBe(1320+5150);
 expect(snapshotShare(storaSnapshots[1]!)).toBe(25);
 expect(storaSnapshots[1]!.total-storaSnapshots[1]!.finland).toBe(19410);
});
it('changes scale while keeping comparability warnings visible',()=>{
 render(<StoraComparison/>);
 expect(screen.getAllByRole('img')).toHaveLength(4);
 fireEvent.click(screen.getByRole('button',{name:'Suomen osuus omassa tilannekuvassa'}));
 expect(screen.getAllByRole('img')).toHaveLength(2);
 expect(screen.getByText(/Sarjoja ei ole harmonisoitu/)).toBeInTheDocument();
 expect(screen.getByText(/ei osoita konsernin kokonaishenkilöstön kasvua/)).toBeInTheDocument();
});
