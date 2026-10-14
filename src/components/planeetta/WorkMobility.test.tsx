import {cleanup,render,screen,fireEvent} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import data from './work-mobility-data.json';
import {mobilityPoint,mobilityIndex,mobilityChange} from './work-mobility';
import {WorkMobility} from './WorkMobility';
import {TimelineProvider} from './timeline-context';
import {workPoint} from './work-opportunity';
afterEach(cleanup);
it('balances commuting counts and derives shares from all-age employed residents',()=>{
 expect(data.points).toHaveLength(760);
 for(const r of data.points){const p=mobilityPoint(String(r[0]),Number(r[1]))!;expect(p.employed).toBe(p.outsideMunicipality+p.withinMunicipality);expect(p.commutingShare).toBeCloseTo(100*p.outsideMunicipality/p.employed);}
});
it('uses matching all-age employment and job index bases without inventing missing jobs',()=>{
 expect(mobilityIndex('MK08',2007,'employed')).toBe(100);expect(mobilityIndex('MK08',2007,'jobs')).toBe(100);
 expect(mobilityIndex('MK08',2024,'jobs')).toBeCloseTo(100*workPoint('MK08',2024)!.jobs['SSS']!/workPoint('MK08',2007)!.jobs['SSS']!);
 expect(mobilityIndex('MK08',2000,'jobs')).toBeNull();expect(mobilityPoint('MK08',2025)).toBeNull();expect(mobilityChange('MK08',2024,2007,'jobs')).toBeNull();expect(mobilityChange('MK08',2007,2007,'jobs')).toBe(0);
});
it('links selection, labels municipality commuting, and preserves historical gaps',()=>{
 render(<TimelineProvider initialYear={1987}><WorkMobility/></TimelineProvider>);
 expect(screen.getByText(/Työpaikkasarja alkaa 2007/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Vertaa 2007–2024'}));
 expect(screen.getByRole('table',{name:'Työn liikkuvuuden vertailu 2007–2024'})).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Liikkuvan työn maakunta'}),{target:{value:'MK01'}});
 expect(screen.getByRole('heading',{name:'Uusimaa · 2024'})).toBeInTheDocument();
 expect(screen.getAllByRole('img')).toHaveLength(4);
 expect(screen.getByText(/sisältää myös maakunnan sisäiset kuntienväliset/)).toBeInTheDocument();
 expect(screen.getByText(/Varantojen erot eivät ole poistumisten lukumääriä/)).toBeInTheDocument();
});
it('marks unsupported shared years and does not mix migration with stock changes',()=>{
 render(<TimelineProvider initialYear={2025}><WorkMobility/></TimelineProvider>);
 expect(screen.getByText(/Näytetään havaintovuosi 2024/)).toBeInTheDocument();
 expect(screen.getByText(/summattavaa selitysjakaumaa/)).toBeInTheDocument();
});
