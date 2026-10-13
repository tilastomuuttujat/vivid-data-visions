import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { LongPath } from './LongPath';
import { longPath } from './long-path-data';
import source from '@/data/anchors.json';
afterEach(cleanup);
it('links every period to available anchor evidence', () => {
  for (const p of longPath) for (const id of p.anchors) expect(source.anchors.some(a => a.id === id), id).toBe(true);
});
it('moves between perspectives and periods while retaining uncertainty and source links', () => {
  render(<LongPath />);
  fireEvent.click(screen.getByRole('button', { name: 'Omistus ja päätösvalta' }));
  expect(screen.getByText('Maan hallinta ja avun järjestäminen')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /1950–1975/ }));
  expect(screen.getByLabelText('Ankkuritapaus')).toHaveValue('maaltamuutto');
  fireEvent.change(screen.getByLabelText('Ankkuritapaus'), { target: { value: 'ruotsiin-muutto-ja-perheiden-arki' } });
  expect(screen.getByLabelText('Ankkuritapaus')).toHaveValue('ruotsiin-muutto-ja-perheiden-arki');
  expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
  expect(screen.getByText(/eivät ole mittauksia/)).toBeInTheDocument();
});
