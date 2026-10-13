import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { HistoricalTurning } from './HistoricalTurning';
import { electionYears, partySeries } from './historical-election-data';
afterEach(cleanup);
it('keeps historical series aligned and includes the post-rise reversal', () => {
  for (const p of partySeries) expect(p.values).toHaveLength(electionYears.length);
  const kok = partySeries.find(p => p.id === 'kok')!;
  expect(kok.values[electionYears.indexOf(1987)]).toBe(23.1);
  expect(kok.values[electionYears.indexOf(1991)]).toBe(19.3);
});
it('lets readers inspect election years and hide party series without losing source limits', () => {
  render(<HistoricalTurning />);
  fireEvent.change(screen.getByRole('slider'), { target: { value: '0' } });
  expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '1962');
  expect(screen.getByText('15 %')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Kokoomus' }));
  expect(screen.queryByText('15 %')).not.toBeInTheDocument();
  expect(screen.getByText(/vuosi 1983 sisältää LKP:n/)).toBeInTheDocument();
  expect(screen.getByText(/eivätkä sitä, että koulutus olisi aiheuttanut/)).toBeInTheDocument();
});
