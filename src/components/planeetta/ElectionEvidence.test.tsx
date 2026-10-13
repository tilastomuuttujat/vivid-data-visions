import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ElectionEvidence } from './ElectionEvidence';
import { participationGap } from './election-evidence';
afterEach(cleanup);
it('shows participation separately from party preference with coverage limits', () => {
  expect(participationGap()).toBe(26.7);
  render(<ElectionEvidence />);
  expect(screen.getAllByRole('img')).toHaveLength(2);
  expect(screen.getByText(/49,1/)).toBeInTheDocument();
  expect(screen.getByText(/Aineisto ei kerro/)).toBeInTheDocument();
  expect(screen.getByText(/ei koulutuksen erillinen syyvaikutus/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox'));
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  expect(screen.getByText('58,4 % äänesti')).toBeInTheDocument();
});
