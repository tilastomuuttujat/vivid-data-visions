import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { CareCapacity } from './CareCapacity';
import { careIndex, careLegalThreshold, careRegions, careValue } from './care-capacity';
import { TimelineProvider } from './timeline-context';
import { SharedTimeline } from './SharedTimeline';
import { exactValue, timelineLanes } from './timeline-model';
afterEach(cleanup);
it('preserves source counts and annual coverage without deriving counts from rounded percentages',()=>{
 expect(careValue(658,2024,'population')).toBe(652831);
 expect(careValue(658,2024,'clients')).toBe(85995);
 expect(careValue(658,2024,'coverage')).toBe(13.2);
 expect(careValue(658,2025,'clients')).toBe(88357);
 expect(careIndex(658,2016,'population')).toBe(100);
 expect(careIndex(658,2025,'population')).toBeGreaterThan(careIndex(658,2025,'clients')!);
 expect(careRegions).toHaveLength(24);
});
it('does not extrapolate absent data or equate changing legal and fixed staffing thresholds',()=>{
 expect(careValue(658,2020,'cost')).toBeNull();
 expect(careValue(658,2025,'fixed')).toBeNull();
 expect(careValue(956,2024,'legal')).toBeNull();
 expect(careValue(658,2024,'fixed')).toBe(32.6);
 expect(careValue(658,2024,'legal')).toBe(93.9);
 expect(careLegalThreshold(2024)).toBe(.65);
 expect(careLegalThreshold(2025)).toBe(.60);
 expect(careValue(658,2024,'cost',true)).toBeCloseTo(8023.2*2339/2332);
 expect(careValue(658,2025,'cost',true)).toBe(7759);
});
it('links the year while keeping the service area independent from the shared maakunta',()=>{
 render(<TimelineProvider initialYear={2024}><SharedTimeline/><CareCapacity/></TimelineProvider>);
 fireEvent.change(screen.getByRole('slider',{name:/Palvelujen havaintovuosi/}),{target:{value:'2025'}});
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','2025');
 fireEvent.change(screen.getByRole('combobox',{name:'Palvelujen alue'}),{target:{value:'956'}});
 expect(screen.getByRole('combobox',{name:'Maakunta'})).toHaveValue('MK08');
 const table=screen.getByRole('table',{name:/Ahvenanmaa · täsmälliset havainnot 2025/});
 expect(within(table).getByRole('row',{name:/Kiinteän 0,7/})).toHaveTextContent('Ei havaintoa');
 expect(screen.getAllByText(/rajauksen|rajaus muuttuu|rajataan/).length).toBeGreaterThan(0);
});
it('identifies out-of-range years and explains survey denominators',()=>{
 render(<TimelineProvider initialYear={1987}><CareCapacity/></TimelineProvider>);
 expect(screen.getByText(/Näytetään havaintovuosi 2016/)).toBeInTheDocument();
 expect(screen.getByText(/Yksikköjen osuus ei ole asiakkaiden osuus/)).toBeInTheDocument();
 expect(screen.getByText(/Puuttuvat havainnot jäävät aukoiksi/)).toBeInTheDocument();
});
it('makes verified 2025 coverage available on the shared timeline',()=>{
 const lane=timelineLanes('MK08').find(l=>l.id==='care')!;
 expect(exactValue(lane.series[0]!,2025)).toBe(13.1);
 expect(exactValue(lane.series[0]!,2015)).toBeNull();
});
