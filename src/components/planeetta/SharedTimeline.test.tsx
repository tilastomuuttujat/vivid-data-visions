import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { TimelineProvider, resolveTimelineYear } from './timeline-context';
import { SharedTimeline } from './SharedTimeline';
import { ProductivityPath } from './ProductivityPath';
import { HistoricalTurning } from './HistoricalTurning';
import { RegionalPath } from './RegionalPath';
import { exactValue, timelineLanes } from './timeline-model';
afterEach(cleanup);
it('keeps exact observations separate from the detailed panels last available survey year',()=>{
 const lanes=timelineLanes('MK08');
 expect(exactValue(lanes.find(l=>l.id==='politics')!.series[0]!,1980)).toBeNull();
 expect(exactValue(lanes.find(l=>l.id==='wealth')!.series[0]!,2000)).toBeNull();
 expect(resolveTimelineYear(2000,{min:1987,max:2023,observed:[1987,1998,2004,2023]})).toBe(1998);
});
it('synchronizes the shared cursor and detailed views in both directions',()=>{
 render(<TimelineProvider><SharedTimeline/><ProductivityPath/><HistoricalTurning/></TimelineProvider>);
 fireEvent.change(screen.getByRole('slider',{name:/Yhteinen vuosi/}),{target:{value:'1980'}});
 expect(screen.getByRole('slider',{name:/Tarkasteluvuosi/})).toHaveAttribute('aria-valuetext','1980');
 expect(screen.getByRole('slider',{name:/Valitse vaalivuosi/})).toHaveAttribute('aria-valuetext','1979');
 expect(screen.getByText(/Näytetään havaintovuosi 1979/)).toBeInTheDocument();
 const table=screen.getByRole('table',{name:'Täsmälliset havainnot vuodelta 1980'});
 expect(within(table).getByRole('row',{name:/Kokoomuksen kannatus/})).toHaveTextContent('Ei havaintoa');
 fireEvent.change(screen.getByRole('slider',{name:/Tarkasteluvuosi/}),{target:{value:'1990'}});
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','1990');
 fireEvent.click(screen.getByRole('button',{name:/29.7.2014: Osakevaihto/}));
 expect(screen.getByRole('slider',{name:/Tarkasteluvuosi/})).toHaveAttribute('aria-valuetext','2014');
 expect(screen.getByRole('link',{name:'Tarkista tapahtuman lähde'})).toHaveAttribute('href',expect.stringContaining('2014/07/29'));
});
it('shares region selection and preserves the historical context with no invented observations',()=>{
 render(<TimelineProvider><SharedTimeline/><RegionalPath/></TimelineProvider>);
 fireEvent.change(screen.getAllByRole('combobox',{name:'Maakunta'})[0]!,{target:{value:'MK01'}});
 // Both the timeline and regional map have a region selector.
 expect(screen.getAllByRole('combobox',{name:'Maakunta'}).every(e=>(e as HTMLSelectElement).value==='MK01')).toBe(true);
 fireEvent.change(screen.getByRole('combobox',{name:'Ajallinen kehys'}),{target:{value:'1850'}});
 fireEvent.change(screen.getByRole('slider',{name:/Yhteinen vuosi/}),{target:{value:'1850'}});
 expect(screen.getByRole('table',{name:'Täsmälliset havainnot vuodelta 1850'})).toHaveTextContent('Ei havaintoa');
});
