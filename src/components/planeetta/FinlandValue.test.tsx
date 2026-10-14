import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { FinlandValue } from './FinlandValue';
import { observedShare, storaFinlandTaxes, taxTotals, valueCompanies } from './finland-value-data';
afterEach(cleanup);
it('reconciles own and collected tax channels without replacing missing values by zero',()=>{
 expect(storaFinlandTaxes.map(taxTotals)).toEqual([{own:103,collected:246,total:349},{own:104,collected:256,total:360}]);
 expect(observedShare(valueCompanies[1]!.staff[0]!)).toBeNull();
 expect(valueCompanies.every(c=>c.pay.finland===null&&c.publicDividend===null)).toBe(true);
});
it('changes company while retaining missing-country and transfer-versus-sale boundaries',()=>{
 render(<FinlandValue/>);
 expect(screen.getByRole('img',{name:/verojalanjälki 2017/})).toBeInTheDocument();
 expect(screen.getByText(/Bruttomyynti ei ole nettotuloutus/)).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Tarkasteltava yhtiö'}),{target:{value:'ssab'}});
 expect(screen.getByRole('img',{name:/2013: tieto puuttuu/})).toBeInTheDocument();
 expect(screen.queryByRole('img',{name:/verojalanjälki 2017/})).not.toBeInTheDocument();
 expect(screen.getByText(/Konsernin tuloverokulua ei sijoiteta Suomeen/)).toBeInTheDocument();
 expect(screen.getByText(/Vuoden 2021 omistuskanavan siirto ei ole myyntitulo/)).toBeInTheDocument();
});
