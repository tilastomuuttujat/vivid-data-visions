import {cleanup,render,screen,fireEvent,within} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {RecoveryMap} from './RecoveryMap';
import {classifyRecovery,assessRecovery,assessGroupRecovery,recoveryValue,recoveryPeriod,recoveryRegions} from './recovery-map';
import {TimelineProvider} from './timeline-context';
import {SharedTimeline} from './SharedTimeline';
afterEach(cleanup);
const rows=(values:(number|null)[])=>values.map((value,i)=>({year:2020+i,value}));
it('distinguishes initial improvement, a lost return, a short return and a maintained observed spell',()=>{
 expect(classifyRecovery(100,rows([110,105,100]),'up',3).status).toBe('noDip');
 expect(classifyRecovery(100,rows([90,95,99]),'up',3).status).toBe('below');
 const lost=classifyRecovery(100,rows([90,100,99]),'up',3);expect(lost.status).toBe('lost');expect(lost.firstReturn).toBe(2021);
 const pending=classifyRecovery(100,rows([90,100,99,101]),'up',3);expect(pending.status).toBe('pending');expect(pending.firstReturn).toBe(2021);expect(pending.spellStart).toBe(2023);expect(pending.streak).toBe(1);
 const held=classifyRecovery(100,rows([90,100,99,101,102,100]),'up',3);expect(held.status).toBe('held');expect(held.firstReturn).toBe(2021);expect(held.spellStart).toBe(2023);expect(held.streak).toBe(3);
 expect(classifyRecovery(100,rows([90,100]),'up',1).status).toBe('held');expect(classifyRecovery(10,rows([12,10,9,8]),'down',3).status).toBe('held');
});
it('never reports recovery over gaps, breaks or a missing baseline',()=>{
 expect(classifyRecovery(null,rows([90,100]),'up',3).status).toBe('noBaseline');
 expect(classifyRecovery(100,[],'up',3).status).toBe('noFollowup');
 expect(classifyRecovery(100,rows([90,null,100]),'up',3).status).toBe('missing');
 expect(classifyRecovery(100,[{year:2020,value:90},{year:2022,value:100}],'up',3).status).toBe('missing');
 const broken=classifyRecovery(100,rows([90,100,101]),'up',3,[2021]);expect(broken.status).toBe('break');expect(broken.firstReturn).toBeNull();
});
it('uses real crisis baselines and caps the followup without inventing historical income or jobs',()=>{
 expect(recoveryRegions).toHaveLength(19);expect(recoveryPeriod('bank',2024)).toEqual({start:1991,base:1990,end:2001});
 expect(recoveryPeriod('finance',2024)).toEqual({start:2008,base:2007,end:2018});
 expect(recoveryValue('MK08',2007,'income')).toBeNull();expect(recoveryValue('MK08',2025,'employment')).toBeNull();
 expect(assessRecovery('bank',2024,'jobs','MK08').status).toBe('noBaseline');
 expect(assessRecovery('finance',2024,'income','MK08').status).toBe('noBaseline');
 expect(assessRecovery('finance',2024,'employment','MK08').status).toBe('break');
 expect(assessGroupRecovery('finance',2024,'age','18-24','MK08').status).toBe('break');
 expect(assessRecovery('pandemic',2019,'employment','MK08').status).toBe('noFollowup');
});
it('links keyboard map selection to the shared region, and exposes group observations',()=>{
 render(<TimelineProvider initialYear={2024}><SharedTimeline/><RecoveryMap/></TimelineProvider>);
 const map=screen.getByRole('group',{name:'Valitse maakunta toipumiskartasta'});
 fireEvent.keyDown(within(map).getByRole('button',{name:/Uusimaa:/}),{key:'Enter'});
 expect(screen.getByRole('combobox',{name:'Maakunta'})).toHaveValue('MK01');
 expect(screen.getByRole('combobox',{name:'Toipumiskartan maakunta'})).toHaveValue('MK01');
 expect(screen.getByRole('table',{name:'Uusimaa: ryhmien toipuminen'})).toHaveTextContent('tuntematon');
 fireEvent.change(screen.getByRole('combobox',{name:'Toipumisen väestöryhmät'}),{target:{value:'age'}});
 expect(screen.getByRole('table',{name:'Uusimaa: ryhmien toipuminen'})).toHaveTextContent('55–64-vuotiaat');
 fireEvent.change(screen.getByRole('combobox',{name:'Palautumisen havaintovuosiehto'}),{target:{value:'5'}});
 expect(screen.getByRole('combobox',{name:'Palautumisen havaintovuosiehto'})).toHaveValue('5');
});
it('shows absent post-crisis observations and opens a real observed followup',()=>{
 render(<TimelineProvider initialYear={1987}><RecoveryMap/></TimelineProvider>);
 expect(screen.getByRole('status')).toHaveTextContent('Ennen kriisiä');
 expect(screen.queryByRole('table',{name:/ryhmien toipuminen/})).not.toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Toipumiskartan kriisi'}),{target:{value:'bank'}});
 fireEvent.click(screen.getByRole('button',{name:'Näytä kriisin toipumisjakso'}));
 expect(screen.getByRole('slider',{name:'Toipumiskartan vuosi'})).toHaveValue('2001');
 fireEvent.change(screen.getByRole('combobox',{name:'Toipumiskartan mittari'}),{target:{value:'jobs'}});
 expect(screen.getAllByText(/Vuoden 1990 lähtötaso puuttuu/).length).toBeGreaterThan(0);
 expect(screen.getByRole('table',{name:'Kymenlaakso: toipumisen taustahavainnot'})).toHaveTextContent('työskentelevät');
});
it('marks latest coverage and explains counts, shares and non-causal context',()=>{
 render(<TimelineProvider initialYear={2025}><RecoveryMap/></TimelineProvider>);
 expect(screen.getByText(/Näytetään havaintovuosi 2024/)).toBeInTheDocument();
 expect(screen.getByText(/Taustamittareita ei lasketa yhteen/)).toBeInTheDocument();
 expect(screen.getByText(/ei ennusta tulevaisuutta/)).toBeInTheDocument();
});
