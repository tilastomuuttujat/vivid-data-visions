import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { OwnershipCashflow } from './OwnershipCashflow';
import { benefitChannels, ownershipCashflow, ownershipScenario, saleGross, soldBlockDividends } from './ownership-cashflow';
import { TimelineProvider } from './timeline-context';
import { SharedTimeline } from './SharedTimeline';
import { FinlandValue } from './FinlandValue';
afterEach(cleanup);
it('uses payment dates and includes both 2024 instalments, excluding pre-sale and post-2025 payments',()=>{
 expect(saleGross).toBeCloseTo(246.4);
 expect(soldBlockDividends(2018)).toEqual([]);
 const payments=soldBlockDividends(2024)!;
 expect(payments.filter(d=>d.date.startsWith('2024')).map(d=>d.perShare)).toEqual([.10,.10]);
 expect(payments.filter(d=>d.profitYear===2018)[0]?.date).toBe('2019-03-25');
 expect(ownershipScenario(2024,17.6,0).nominalDividends).toBeCloseTo(34.3);
 expect(ownershipScenario(2025,17.6,0).nominalDividends).toBeCloseTo(37.8);
 expect(soldBlockDividends(2026)).toBeNull();
 expect(ownershipCashflow.dividends.every(d=>d.date>ownershipCashflow.storaSale.date)).toBe(true);
});
it('accounts for the retained asset and exact-date discounting instead of comparing sale proceeds with dividends alone',()=>{
 const zero=ownershipScenario(2025,17.6,0),discounted=ownershipScenario(2025,17.6,5);
 expect(zero.nominalAsset).toBeCloseTo(246.4);
 expect(zero.retainedPV).toBeCloseTo(284.2);
 expect(zero.priceForEqualPV).toBeCloseTo(14.9);
 expect(ownershipScenario(2025,zero.priceForEqualPV,0).retainedPV).toBeCloseTo(saleGross);
 expect(discounted.retainedPV).toBeLessThan(zero.retainedPV);
 expect(discounted.priceForEqualPV).toBeGreaterThan(zero.priceForEqualPV);
 expect(ownershipScenario(2025,discounted.priceForEqualPV,5).retainedPV).toBeCloseTo(saleGross);
 expect(ownershipScenario(2025,0,0).assetPV).toBe(0);
 expect(()=>ownershipScenario(2026,17,0)).toThrow();
 expect(()=>ownershipScenario(2025,NaN,0)).toThrow();
 expect(()=>ownershipScenario(2025,17,-1)).toThrow();
});
it('keeps corporate sale proceeds, internal public transfers and public cash dividends separate',()=>{
 const t=ownershipCashflow.transactions;
 expect(t.find(t=>t.company==='sampo')?.recipient).toBe('Sampo Oyj');
 expect(t.find(t=>t.company==='ssab'&&t.year===2021)?.form).toMatch(/Osakkeet/);
 expect(ownershipCashflow.solidiumBridge.cashToState).toBe(351);
 expect(ownershipCashflow.solidiumBridge.stockToState).toBe(155);
 expect(benefitChannels('ssab')[2]?.value).toBeNull();
 expect(benefitChannels('sampo').every(c=>c.value===null)).toBe(true);
});
it('links the cutoff and updates user assumptions while labeling the counterfactual and missing country data',()=>{
 render(<TimelineProvider initialYear={2025}><SharedTimeline/><OwnershipCashflow/></TimelineProvider>);
 const table=screen.getByRole('table',{name:/Myydyn R-osake-erän osinkojen jälkivertailu vuoden 2025/});
 expect(within(table).getByRole('row',{name:/Nimelliset osingot yhteensä/})).toHaveTextContent('37,8');
 fireEvent.change(screen.getByRole('slider',{name:/Oletettu loppuhinta/}),{target:{value:'0'}});
 expect(screen.getByText(/Osinkojen nykyarvo/)).toHaveTextContent('osakkeiden oletettu nykyarvo 0');
 fireEvent.change(screen.getByRole('slider',{name:/Rahavirtanäkymän vuosi/}),{target:{value:'2024'}});
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2024');
 expect(screen.getByText(/ei valtion toteutunut osinkomenetys/)).toBeInTheDocument();
 expect(screen.getByText(/A-osakkeiden hankinta, koko salkun uudelleensijoitukset/)).toBeInTheDocument();
});
it('opens Sampo and SSAB without routing their transaction value directly into the state budget',()=>{
 render(<OwnershipCashflow/>);
 fireEvent.change(screen.getByRole('combobox',{name:'Rahavirtatapaus'}),{target:{value:'sampo'}});
 const table=screen.getByRole('table',{name:/Leonia–Sampo · omistusjärjestelyjen vastaanottajat/});
 expect(within(table).getByRole('cell',{name:'Sampo Oyj'})).toBeInTheDocument();
 expect(screen.queryByRole('slider',{name:/Oletettu loppuhinta/})).not.toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Rahavirtatapaus'}),{target:{value:'ssab'}});
 expect(screen.getByText(/ei kirjata osakemyynnin käteistuloksi/)).toBeInTheDocument();
});
it('extends the existing company benefit view and makes the new event theme selectable',()=>{
 render(<TimelineProvider initialYear={2018}><SharedTimeline/><FinlandValue/></TimelineProvider>);
 expect(screen.getByRole('heading',{name:'Minne työn tuottama hyöty jää?'})).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Tapahtumien päätöspolku'}),{target:{value:'Omistus ja tulovirrat'}});
 expect(screen.getByRole('combobox',{name:'Tapahtumien päätöspolku'})).toHaveValue('Omistus ja tulovirrat');
});
