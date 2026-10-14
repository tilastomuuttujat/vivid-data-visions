import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { BudgetPower, budgetSegments } from './BudgetPower';
import { budgetAuthor, budgetPoint, budgetPoints, budgetValue, executionCabinets } from './budget-history';
import { TimelineProvider } from './timeline-context';
import { SharedTimeline } from './SharedTimeline';
import { exactValue, timelineLanes } from './timeline-model';
afterEach(cleanup);
it('preserves published main-title totals, excludes principal repayments and keeps missing years missing',()=>{
 expect(budgetPoint(2012,'actual')?.expenseTotal).toBe(53446);
 expect(budgetPoint(2021,'actual')?.expenseTotal).toBe(66002);
 expect(budgetPoint(2024,'actual')?.expenseTotal).toBe(86710);
 expect(budgetPoint(2000,'actual')?.expenseTotal).toBe(38472-5519);
 expect(budgetPoint(2025,'actual')).toBeUndefined();
 expect(budgetValue(undefined,'29','expense','real')).toBeNull();
 expect(budgetValue(budgetPoint(2024,'actual'),'29','expense','real')).toBe(8.136);
 expect(budgetPoint(2000,'actual')?.income['borrowing']).toBeNull();
 expect(budgetPoint(2018,'actual')?.income['borrowing']).toBe(-986);
 expect(budgetPoint(2014,'actual')?.income['directTaxes']).toBeNull();
 expect(budgetPoint(2015,'actual')?.incomeDetailVerified).toBe(true);
 for(const point of budgetPoints.filter(p=>p.incomeDetailVerified)){
  const sum=['directTaxes','turnoverExcise','otherTaxes'].reduce((sum,key)=>sum+point.income[key]!,0);
  expect(Math.abs(sum-point.income['11']!)).toBeLessThanOrEqual(.51);
 }
 const series=timelineLanes('MK08').find(l=>l.id==='budget')!.series[0]!;
 expect(exactValue(series,2025)).toBeNull();
});
it('attributes the proposal independently of the governments administering that year',()=>{
 expect(budgetAuthor(2015).name).toBe('Stubb');
 expect(budgetAuthor(2020).name).toBe('Rinne');
 expect(budgetAuthor(2023).name).toBe('Marin');
 expect(budgetAuthor(2024).name).toBe('Orpo');
 expect(executionCabinets(2015)).toBe('Stubb → Sipilä');
 expect(executionCabinets(2023)).toBe('Marin → Orpo');
 const parts=budgetSegments(budgetPoints.filter(p=>p.stage==='actual'),'32','expense','real');
 expect(parts.some(p=>p.some(v=>v.year===2007)&&p.some(v=>v.year===2008))).toBe(false);
});
it('synchronizes the budget cursor, exposes the accounting caveat and switches to a real proposal in 2025',()=>{
 render(<TimelineProvider initialYear={2023}><SharedTimeline/><BudgetPower/></TimelineProvider>);
 expect(screen.getByText(/Alkuperäisen esityksen valmistelija:/).parentElement).toHaveTextContent('Marin');
 fireEvent.click(within(screen.getByRole('region',{name:'Mihin yhteiskunnan suuntaa rahoitettiin?'})).getByRole('button',{name:/2023 · Vuoden 2023 tulot/}));
 expect(screen.getByText(/ei ollut uutta varsinaista tuloa/)).toBeInTheDocument();
 fireEvent.change(screen.getByRole('slider',{name:/Budjettivuosi/}),{target:{value:'2025'}});
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2025');
 const table=screen.getByRole('table',{name:'Menojen budjettivertailu 2025'});
 expect(within(table).getByRole('row',{name:/Opetus ja kulttuuri/})).toHaveTextContent('Ei havaintoa');
 fireEvent.change(screen.getByRole('combobox',{name:'Budjetin vaihe'}),{target:{value:'proposal'}});
 expect(screen.getByRole('table',{name:'Tulojen lähteet 2025'})).not.toHaveTextContent('Ei havaintoa');
 fireEvent.change(screen.getByRole('combobox',{name:'Korosta budjetin valmistelija'}),{target:{value:'rinne'}});
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2020');
});
it('opens budget responsibility events from the shared historical timeline',()=>{
 render(<TimelineProvider initialYear={2015}><SharedTimeline/></TimelineProvider>);
 fireEvent.change(screen.getByRole('combobox',{name:'Tapahtumien päätöspolku'}),{target:{value:'Budjettivalta'}});
 fireEvent.click(screen.getByRole('button',{name:/Vuoden 2015 budjetti: Stubb valmisteli/}));
 expect(screen.getByText(/Alkuperäisen esityksen antoi Stubbin hallitus/)).toBeInTheDocument();
});
