import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MechanismExplorer } from './MechanismExplorer';
import { explanationModels } from './mechanism-models';
import data from '@/data/anchors.json';

afterEach(cleanup);
describe('Mechanism explorer', () => {
  it('references available cases with readable evidence steps', () => {
    for (const m of explanationModels) {
      expect(m.anchors.length).toBeGreaterThanOrEqual(2);
      for (const id of m.anchors) {
        const a = data.anchors.find(a => a.id === id);
        expect(a, id).toBeDefined();
        expect(a!.steps.length).toBeGreaterThan(0);
      }
    }
  });
  it('lets readers hide hypotheses while retaining case evidence', () => {
    render(<MechanismExplorer />);
    expect(screen.getByRole('img')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getAllByText('Lähteet, rajaukset ja vaihtoehdot')).toHaveLength(2);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('Mikä koettelisi mallia?')).toBeInTheDocument();
  });
  it('changes models and supports independent case/step comparison', () => {
    render(<MechanismExplorer />);
    fireEvent.click(screen.getByRole('button', { name: 'Eri aikajänteet' }));
    expect(screen.getByRole('heading', { name: 'Muuttuuko arvio, kun katsotaan pidempää aikaa?' })).toBeInTheDocument();
    const choice = screen.getByLabelText('Tapaus 1');
    fireEvent.change(choice, { target: { value: 'koronapandemia' } });
    expect(choice).toHaveValue('koronapandemia');
    fireEvent.change(screen.getAllByLabelText('Tarkasteltava vaihe')[0]!, { target: { value: '1' } });
    expect(screen.getAllByLabelText('Tarkasteltava vaihe')[0]).toHaveValue('1');
    const note = screen.getByRole('textbox');
    fireEvent.change(note, { target: { value: 'Tarvitsen tarkemman aikajanan.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mittari ja tavoite' }));
    expect(note).toHaveValue('Tarvitsen tarkemman aikajanan.');
  });
});
