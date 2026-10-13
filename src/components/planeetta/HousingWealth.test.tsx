import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import data from './housing-wealth-data.json';
import { HousingWealth } from './HousingWealth';
afterEach(cleanup);
it('keeps only survey years and preserves source column identities',()=>{
  expect(data.wealthYears).toEqual([1987,1988,1994,1998,2004,2009,2013,2016,2019,2023]);
  expect(data.wealth).toHaveLength(30);
  const source=data.sources['151z'].response;
  const keys=source.columns.filter(c=>c.type!=='c').map(c=>c.code);
  const cols=source.columns.filter(c=>c.type==='c').map(c=>c.code);
  for(const p of data.wealth){
    const r=source.data.find(r=>r.key[keys.indexOf('timeperiod_y')]===String(p.year)&&r.key[keys.indexOf('hallintaperuste_1_20150401')]===p.group)!;
    const value=r.values[cols.indexOf('vtutk_mediaani_r')]!;
    expect(p.median).toBe(['.','..','...',''].includes(value)?null:Number(value));
  }
});
it('lets readers inspect actual survey years and choose housing costs or expenditures',()=>{
  render(<HousingWealth/>);
  fireEvent.change(screen.getByRole('combobox',{name:'Varallisuuden tutkimusvuosi'}),{target:{value:'2009'}});
  expect(screen.getByRole('heading',{name:/Nettovarallisuuden mediaani asumisryhmittäin · 2009/})).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox',{name:'Ikäryhmien mittari'}),{target:{value:'owners'}});
  expect(screen.getByRole('img',{name:/Ikäryhmien omistusasumisen osuus, 2009/})).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox',{name:'Asumisen mittari'}),{target:{value:'expenditureShare'}});
  expect(screen.getByText(/Oma asunto:/,{selector:'p[aria-live]'})).toHaveTextContent('18,6');
  expect(screen.getByText(/ei ole saman sukupolven seuranta/)).toBeInTheDocument();
});
