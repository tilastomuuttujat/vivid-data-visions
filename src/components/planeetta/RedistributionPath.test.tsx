import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import data from './redistribution-data.json';
import { RedistributionPath } from './RedistributionPath';
afterEach(cleanup);
it('preserves source values independently of API column order',()=>{
  const source=data.source.response;
  const keys=source.columns.filter(c=>c.type!=='c').map(c=>c.code);
  const cols=source.columns.filter(c=>c.type==='c').map(c=>c.code);
  for(const region of data.regions){
    expect(region.points).toHaveLength(30);
    for(const p of region.points){
      const raw=source.data.find(r=>r.key[keys.indexOf('alue_23_20250101')]===region.id&&r.key[keys.indexOf('timeperiod_y')]===String(p.year))!;
      expect(p.gini_tuotektu).toBe(Number(raw.values[cols.indexOf('gini_tuotektu')]));
      expect(p.yht_vai).toBe(Number(raw.values[cols.indexOf('yht_vai')]));
    }
  }
});
it('switches years and regions and preserves the definition break',()=>{
  render(<RedistributionPath/>);
  expect(screen.getAllByRole('img')).toHaveLength(2);
  fireEvent.change(screen.getByRole('slider'),{target:{value:'1995'}});
  expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext','1995');
  fireEvent.change(screen.getByRole('combobox'),{target:{value:'SSS'}});
  expect(screen.getAllByRole('img')).toHaveLength(1);
  expect(screen.getByText(/Tasaava vaikutus yhteensä: 54,5/)).toBeInTheDocument();
  expect(screen.getByText(/Viivaa ei yhdistetä/)).toBeInTheDocument();
  expect(screen.getByText(/palvelujen.*rahallista arvoa/)).toBeInTheDocument();
});
