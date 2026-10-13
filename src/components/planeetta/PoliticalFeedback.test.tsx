import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PoliticalFeedback } from './PoliticalFeedback';
afterEach(cleanup);
it('lets readers distinguish the supported association from the ownership hypothesis', () => {
  render(<PoliticalFeedback />);
  expect(screen.getByText(/Tutkimuksen tukema yhteys:/)).toBeInTheDocument();
  const ownership = screen.getByRole('button', { name: 'Omistus ja Suomen painopiste' });
  fireEvent.click(ownership);
  expect(ownership).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Vaurastuminen ja kannatus' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByText(/Tutkittava syy-yhteys:/)).toBeInTheDocument();
  expect(screen.getByText(/myös silloin, kun ulkomainen henkilöstö vähenee/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Työ, verotus ja riskien jako' }));
  expect(screen.getByText(/myös suhdanteet ja menotarpeet/)).toBeInTheDocument();
});
