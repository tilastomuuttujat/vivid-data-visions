import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ProductivityPath } from './ProductivityPath';
import data from './productivity-data.json';
afterEach(cleanup);
it('uses every annual observation and source column order for labour share',()=>{
  expect(data.series).toHaveLength(45);
  const source=data.sources['14w6'].response;
  const columns=source.columns.filter(c=>c.type==='c').map(c=>c.code);
  for(const row of data.series){
    const raw=source.data.find(r=>r.key[0]===String(row.year))!;
    expect(row.labourShare).toBeCloseTo(Number(raw.values[columns.indexOf('Tyopanos_korv')])/Number(raw.values[columns.indexOf('ARVL_CP')])*100,8);
    expect(Number.isFinite(row.realEarnings)).toBe(true);
  }
  expect(data.series[0]!.productivity).toBe(100);
  expect(data.series[0]!.realEarnings).toBe(100);
});
it('rebases both indices and keeps the cursor inside the selected period',()=>{
  render(<ProductivityPath/>);
  fireEvent.change(screen.getByRole('slider'),{target:{value:'1980'}});
  fireEvent.change(screen.getByRole('combobox'),{target:{value:'2010'}});
  expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext','2010');
  expect(screen.getByText(/Tuottavuus/, {selector:'p[aria-live]'})).toHaveTextContent('Tuottavuus 100 · reaaliansiot 100');
  expect(screen.getByText(/laajemman palkansaajajoukon/)).toBeInTheDocument();
});
