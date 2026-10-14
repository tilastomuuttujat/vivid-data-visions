import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { RegionalOverlap } from './RegionalOverlap';
import { overlapChange, overlapMatch, overlapMetricIds, overlapRegions, overlapShade, overlapTurns, overlapValue } from './regional-overlap';
import { TimelineProvider } from './timeline-context';
import { SharedTimeline } from './SharedTimeline';
afterEach(cleanup);
it('uses workplace-register counts and distinguishes relative change from percentage-point change',()=>{
 expect(overlapValue('MK08',2024,'jobs')).toBe(58589);
 expect(overlapValue('MK08',2016,'jobs')).toBe(60982);
 expect(overlapChange('MK08',2016,2024,'jobs')).toBeCloseTo((58589/60982-1)*100);
 expect(overlapChange('MK08',2016,2024,'older')).toBeCloseTo(4.9);
 expect(overlapChange('MK08',2016,2024,'poverty')).toBeCloseTo(1.2);
 expect(overlapRegions).toHaveLength(19);
 expect(overlapMetricIds).toHaveLength(5);
});
it('intersects reader-selected directions without making a score, and keeps missing observations separate from no change',()=>{
 expect(overlapMatch('MK08',2016,2024,[{metric:'jobs',direction:'down'},{metric:'older',direction:'up'}])).toBe('yes');
 expect(overlapMatch('MK08',2016,2024,[{metric:'jobs',direction:'up'}])).toBe('no');
 expect(overlapMatch('MK08',2016,2016,[{metric:'jobs',direction:'down'}])).toBe('no');
 expect(overlapMatch('MK08',2016,2024,[])).toBe('yes');
 expect(overlapMatch('MK08',2000,2024,[{metric:'jobs',direction:'down'}])).toBe('missing');
 expect(overlapShade(null,'jobs')).not.toBe(overlapShade(0,'jobs'));
 expect(overlapChange('MK08',2024,2016,'jobs')).toBeNull();
 expect(overlapValue('MK08',2025,'poverty')).toBeNull();
 expect(overlapValue('MK08',2009,'poverty')).toBeNull();
});
it('does not identify a trend turn across source changes',()=>{
 expect(overlapTurns('MK08','jobs').some(t=>t.year===2019)).toBe(false);
 expect(overlapTurns('MK08','longTerm').some(t=>t.year===2017)).toBe(false);
 for(const t of overlapTurns('MK08','poverty'))expect(t.year).toBeGreaterThanOrEqual(2012);
});
it('links map selection and year to the shared timeline',()=>{
 render(<TimelineProvider initialYear={2024}><SharedTimeline/><RegionalOverlap/></TimelineProvider>);
 const map=screen.getByRole('group',{name:'Valitse maakunta kehityssuuntien teemakartasta'});
 fireEvent.keyDown(within(map).getByRole('button',{name:/^Uusimaa:/}),{key:'Enter'});
 expect(screen.getByRole('combobox',{name:'Maakunta'})).toHaveValue('MK01');
 expect(screen.getByRole('combobox',{name:'Yhdistetyn näkymän maakunta'})).toHaveValue('MK01');
 fireEvent.change(screen.getByRole('slider',{name:/Yhdistetyn näkymän vuosi/}),{target:{value:'2020'}});
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2020');
 expect(screen.getAllByRole('img',{name:/1990–2024/})).toHaveLength(5);
});
it('requires a separate service region and clears it on every maakunta change, including a return to the original region',()=>{
 render(<RegionalOverlap/>);
 const service=screen.getByRole('combobox',{name:'Palvelujen tarkastelualue'});
 expect(service).toHaveValue('');
 fireEvent.change(service,{target:{value:'967'}});
 expect(screen.getByRole('table',{name:'Kymenlaakson hyvinvointialue · palveluhavainnot 2024'})).toBeInTheDocument();
 expect(screen.getByRole('img',{name:/Valitun palvelualueen 75/})).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Yhdistetyn näkymän maakunta'}),{target:{value:'MK01'}});
 expect(service).toHaveValue('');
 expect(screen.queryByRole('table',{name:/palveluhavainnot/})).not.toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Yhdistetyn näkymän maakunta'}),{target:{value:'MK08'}});
 expect(service).toHaveValue('');
});
it('does not invent early service data or infer workforce and care coverage for Ahvenanmaa',()=>{
 render(<TimelineProvider initialYear={2010}><RegionalOverlap/></TimelineProvider>);
 fireEvent.change(screen.getByRole('combobox',{name:'Palvelujen tarkastelualue'}),{target:{value:'956'}});
 const table=screen.getByRole('table',{name:'Ahvenanmaa · palveluhavainnot 2010'});
 expect(within(table).getByRole('row',{name:/Suunnitellut kotihoidon tunnit/})).toHaveTextContent('Ei havaintoa');
 expect(within(table).getByRole('row',{name:/75 vuotta täyttäneet/})).toHaveTextContent('Ei havaintoa');
 expect(screen.getByRole('combobox',{name:'Vertailun lähtövuosi'})).toHaveValue('2010');
});
it('marks latest-year coverage and keeps interpretation limits visible',()=>{
 render(<TimelineProvider initialYear={2025}><RegionalOverlap/></TimelineProvider>);
 expect(screen.getByText(/Näytetään havaintovuosi 2024/)).toBeInTheDocument();
 expect(screen.getByText(/kartta ei anna maakunnille yhteistä arvosanaa/)).toBeInTheDocument();
 expect(screen.getAllByText(/suunnanvaihto ei osoita pysyvää käännettä/)).toHaveLength(5);
});

it('opens a meaningful observed comparison from an older shared historical year',()=>{
 render(<TimelineProvider initialYear={1987}><SharedTimeline/><RegionalOverlap/></TimelineProvider>);
 expect(screen.getByText(/Lähtö- ja loppuvuosi ovat samat/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Uudempi vaihe 2016–2024'}));
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2024');
 expect(screen.getByRole('combobox',{name:'Vertailun lähtövuosi'})).toHaveValue('2016');
 expect(screen.queryByText(/Lähtö- ja loppuvuosi ovat samat/)).not.toBeInTheDocument();
});
