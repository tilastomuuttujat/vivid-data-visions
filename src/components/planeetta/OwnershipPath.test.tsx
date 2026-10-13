import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { OwnershipPath, ownershipEvents } from './OwnershipPath';
afterEach(cleanup);
it('keeps each event linked to a primary public source',()=>{for(const e of ownershipEvents) expect(e.url.startsWith('https://')).toBe(true);});
it('separates announced jobs from dismissals and discloses missing series',()=>{
 render(<OwnershipPath/>);
 fireEvent.click(screen.getByRole('button',{name:/15.12.2015/}));
 expect(screen.getByText(/ei tarkoita 180 toteutunutta irtisanomista/)).toBeInTheDocument();
 expect(screen.getByText(/Vertailukelpoinen sarja puuttuu/)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Tarkista tapahtuman lähde'})).toHaveAttribute('href',ownershipEvents[2]!.url);
 fireEvent.click(screen.getByRole('button',{name:/29.7.2014/}));
 expect(screen.getByText(/Valtion omistuskanava jatkui/)).toBeInTheDocument();
});
