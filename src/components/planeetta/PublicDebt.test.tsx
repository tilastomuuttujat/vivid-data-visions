import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import data from './public-debt-data.json';
import { PublicDebt } from './PublicDebt';
afterEach(cleanup);
it('uses available aggregates for each sector and preserves stock-flow differences',()=>{
 expect(data.treasury.points).toHaveLength(45);
 for(const s of data.sectors){
  expect(s.points).toHaveLength(45);
  for(const p of s.points){
   const revenue=s.id==='S1311'?p['OTRU_ntp-cp']:p['OTRS_ntp-cp'];
   const expenditure=s.id==='S1311'?p['OTEU_ntp-cp']:p['OTES_ntp-cp'];
   expect(revenue).toBeGreaterThan(0);expect(expenditure).toBeGreaterThan(0);
   expect(revenue!-expenditure!).toBeCloseTo(p['B9_ntp-cp']!,0);
  }
 }
 expect(data.treasury.points[44]!.millionEuros).toBe(169414);
 const state=data.sectors.find(s=>s.id==='S1311')!;
 expect(state.points[44]!['jali-D']).not.toBe(data.treasury.points[44]!.millionEuros);
});
it('lets readers switch units, years and sector while retaining stock-flow cautions',()=>{
 render(<PublicDebt/>);
 fireEvent.change(screen.getByRole('slider'),{target:{value:'1990'}});
 expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext','1990');
 fireEvent.change(screen.getByRole('combobox',{name:'Asteikko'}),{target:{value:'euros'}});
 fireEvent.change(screen.getByRole('combobox',{name:'Tulojen ja menojen sektori'}),{target:{value:'S13'}});
 expect(screen.getByRole('heading',{name:/Julkisyhteisöt yhteensä: tulot ja menot/})).toBeInTheDocument();
 expect(screen.getByText(/Velkakannan vuosimuutos voi poiketa alijäämästä/)).toBeInTheDocument();
 expect(screen.getByText(/osakemyyntien vuosittaista sarjaa ei ole/)).toBeInTheDocument();
});
