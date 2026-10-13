import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { RegionalPath } from './RegionalPath';
import data from './regional-path-data.json';
import geo from '@/data/maakunnat.json';
afterEach(cleanup);
it('covers every map region and keeps absent historical observations distinct from zero',()=>{
  expect(data.regions.map(r=>r.id)).toEqual([...geo.regions.map(r=>r.id),'SSS']);
  for(const r of data.regions){
    expect(r.points).toHaveLength(35);
    expect(r.points[0]!.year).toBe(1990);
    expect(r.points[0]!.income).toBeNull();
    expect(r.points[0]!.jobs).toBeNull();
    for(const p of r.points){
      expect(p.population).toBeGreaterThan(0);
      if(p.industry!==null&&p.jobs!==null) expect(p.industry).toBeLessThanOrEqual(p.jobs);
    }
  }
});
it('clamps years to metric coverage and supports keyboard map selection',()=>{
  render(<RegionalPath/>);
  fireEvent.change(screen.getByRole('slider'),{target:{value:'1990'}});
  fireEvent.change(screen.getByRole('combobox',{name:'Mittari'}),{target:{value:'industry'}});
  expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext','2000');
  const map=screen.getByRole('button',{name:/Uusimaa:/});
  fireEvent.keyDown(map,{key:'Enter'});
  expect(map).toHaveAttribute('aria-pressed','true');
  expect(screen.getByRole('combobox',{name:'Maakunta'})).toHaveValue('MK01');
  expect(screen.getByText(/vuoden lopun rekisterityöpaikkojen määrä/)).toBeInTheDocument();
});
