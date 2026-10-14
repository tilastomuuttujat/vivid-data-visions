import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { HouseholdImpact } from './HouseholdImpact';
import { distribution2018, householdChange, householdPoint, householdVintages } from './household-impact';
import { TimelineProvider } from './timeline-context';
import { SharedTimeline } from './SharedTimeline';
afterEach(cleanup);
it('retains the source net income and makes compensation and rounding visible',()=>{
 expect(householdChange('2025','single-parent',2023,2024)).toEqual({gross:74,transfers:-182,taxEffect:5,net:-103,rounding:0,percent:-103/2600*100});
 expect(householdPoint('2025','single-parent',2022)).toBeNull();
 expect(householdChange('2025','single-parent',2022,2024)).toBeNull();
 for(const vintage of householdVintages)for(const profile of vintage.profiles)for(const point of profile.points){
  expect(Math.abs(point.gross+point.transfers-point.taxes-point.net)).toBeLessThanOrEqual(1);
  expect(point.year).toBeLessThanOrEqual(2025);
 }
 expect(householdChange('2025','high-income',2023,2025)?.rounding).toBe(-1);
});
it('separates publications and keeps the changed earnings-benefit assumption explicit',()=>{
 expect(householdPoint('2024','earnings-unemployed',2025)?.net).toBe(1396);
 expect(householdPoint('2025','earnings-unemployed',2025)?.net).toBe(1567);
 render(<TimelineProvider initialYear={2025}><HouseholdImpact/></TimelineProvider>);
 fireEvent.change(screen.getByRole('combobox',{name:'Esimerkkikotitalous'}),{target:{value:'earnings-unemployed'}});
 expect(screen.getByText(/ensimmäisiltä 40 päivärahapäivältä/)).toBeInTheDocument();
 expect(screen.getByText('Julkaisuhetken ennustelaskelma')).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Esimerkkilaskelman julkaisu'}),{target:{value:'2024'}});
 expect(screen.getByText(/Porrastus sisältyy vuoden 2025 laskelmaan/)).toBeInTheDocument();
 const table=screen.getByRole('table',{name:'Esimerkkikotitalouden tulot 2023 ja 2025'});
 expect(within(table).getByRole('row',{name:/Käytettävissä oleva tulo/})).toHaveTextContent('1 396');
});
it('links years without inventing an example for an unreported year and opens the research scope',()=>{
 render(<TimelineProvider initialYear={2024}><SharedTimeline/><HouseholdImpact/></TimelineProvider>);
 fireEvent.click(screen.getByRole('button',{name:/2025 · ennustelaskelma/}));
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2025');
 fireEvent.change(screen.getByRole('slider',{name:/Yhteinen vuosi/}),{target:{value:'2022'}});
 expect(screen.getByText(/Näytetään laskentavuosi 2015/)).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Tapahtumien päätöspolku'}),{target:{value:'Kotitalouksien toimeentulo'}});
 fireEvent.click(screen.getAllByRole('button',{name:/2018 · Verojen ja etuuksien yhteisvaikutus/})[0]!);
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2018');
 expect(screen.getAllByText(/Arvioitu työllisyysvaikutus ei ole havaittu/).length).toBeGreaterThan(0);
});
it('uses the published sensitivity scenarios rather than interpolated or observed outcomes',()=>{
 expect(distribution2018.variants.A.changes['0'][2]).toBe(.8);
 expect(distribution2018.variants.B.changes['0.25'][2]).toBe(-.4);
 render(<HouseholdImpact/>);
 fireEvent.change(screen.getByRole('combobox',{name:'Politiikkamuutoksen rajaus'}),{target:{value:'B'}});
 fireEvent.change(screen.getByRole('combobox',{name:'Työllistymisen oletus'}),{target:{value:'0.25'}});
 const table=screen.getByRole('table',{name:'Vuoden 2018 tutkimuksen tulonjakoarvio'});
 expect(within(table).getByRole('row',{name:/Lasten pienituloisuus/})).toHaveTextContent(/[-−]0,4/);
 expect(screen.getByText(/Työn kysyntää ja työpaikkojen saatavuutta ei mallinneta/)).toBeInTheDocument();
});
