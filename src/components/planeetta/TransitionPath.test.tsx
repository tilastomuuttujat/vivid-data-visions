import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { TransitionPath, transitionTracks } from './TransitionPath';
import source from '@/data/anchors.json';
afterEach(cleanup);
it('references existing stages and retains temporal bounds',()=>{
  for(const t of transitionTracks){expect(source.anchors.find(a=>a.id===t.anchor)?.steps[t.step]).toBeDefined();expect(t.start).toBeLessThanOrEqual(t.end);}
});
it('changes evidence and distinguishes parallel schooling from family history',()=>{
  render(<TransitionPath/>);
  fireEvent.click(screen.getByRole('button',{name:'Osaaminen'}));
  expect(screen.getByText(/ei ole näyttö Aron perheen koulutuksesta/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Lastenhoito'}));
  expect(screen.getByRole('heading',{name:'Lastenhoito: 1974–1974'})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:/Avaa lähtöalueen/}));
  expect(screen.getByText(/eri lähteitä ja eri maita/)).toBeInTheDocument();
});
